import B2 from 'backblaze-b2';
import { query } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

export class B2Service {
  constructor() {
    this.clients = new Map();
    this.accounts = [];
  }

  // Parse endpoint to extract region if needed
  parseEndpoint(endpoint) {
    // Example: s3.us-east-005.backblazeb2.com -> us-east-005
    const match = endpoint.match(/s3\.([^.]+)\.backblazeb2\.com/);
    return match ? match[1] : 'us-east-005';
  }

  async initialize() {
    const result = await query('SELECT * FROM b2_accounts');
    this.accounts = result.rows;
    let initializedCount = 0;
    
    for (const account of this.accounts) {
      const b2 = new B2({
        applicationKeyId: account.key_id,
        applicationKey: account.app_key,
      });
      try {
        const authResponse = await b2.authorize();
        // Store the bucket ID from the authorization response
        // For keys restricted to a single bucket, the response includes allowed.bucketId
        const bucketId = authResponse.data.allowed?.bucketId;
        
        // Store the endpoint, parsed region, and bucketId with the account
        account.bucket_endpoint = account.bucket_endpoint;
        account.region = this.parseEndpoint(account.bucket_endpoint);
        account.bucket_id = bucketId; // Store the real bucket ID for uploads
        this.clients.set(account.id, { 
          b2, 
          account, 
          uploadUrl: null, 
          uploadAuthToken: null,
          downloadAuthToken: null,
          downloadAuthExpiresAt: 0
        });
        initializedCount++;
        console.log(`B2 account "${account.name}" (${account.id}) initialized`);
      } catch (err) {
        console.warn(`Failed to initialize B2 account "${account.name}" (${account.id}): ${err.message}`);
      }
    }
    console.log(`Initialized ${initializedCount}/${this.accounts.length} B2 accounts`);
  }

  async reauthorizeAccount(accountId) {
    const client = this.clients.get(accountId);
    if (!client) throw new Error(`B2 account ${accountId} not found`);
    
    const { b2, account } = client;
    try {
      const authResponse = await b2.authorize();
      const bucketId = authResponse.data.allowed?.bucketId;
      account.bucket_id = bucketId;
      // Invalidate cached upload URL since auth changed
      client.uploadUrl = null;
      client.uploadAuthToken = null;
      // Invalidate cached download auth since main auth changed
      client.downloadAuthToken = null;
      client.downloadAuthExpiresAt = 0;
      console.log(`B2 account "${account.name}" (${account.id}) re-authorized`);
      return client;
    } catch (err) {
      console.error(`Failed to re-authorize B2 account "${account.name}" (${account.id}): ${err.message}`);
      throw err;
    }
  }

  // Get or refresh upload URL for an account
  async getUploadUrl(accountId) {
    const client = this.clients.get(accountId);
    if (!client) throw new Error(`B2 account ${accountId} not found`);
    
    const { b2, account } = client;
    const bucketId = account.bucket_id;
    if (!bucketId) {
      throw new Error(`B2 account ${accountId} has no bucket ID stored`);
    }
    
    const uploadUrlResponse = await b2.getUploadUrl({ bucketId });
    const { uploadUrl, authorizationToken } = uploadUrlResponse.data;
    
    client.uploadUrl = uploadUrl;
    client.uploadAuthToken = authorizationToken;
    
    return { uploadUrl, authorizationToken };
  }

  // Wrapper to execute B2 operations with automatic re-auth on 401
  async executeWithRetry(accountId, operation) {
    const client = this.clients.get(accountId);
    if (!client) throw new Error(`B2 account ${accountId} not found`);
    
    try {
      return await operation(client);
    } catch (err) {
      // Check if it's a 401 unauthorized error (token expired)
      const isUnauthorized = err.response?.status === 401 || 
                             err.status === 401 || 
                             (err.message && err.message.includes('401'));
      
      if (isUnauthorized) {
        console.log(`B2 account ${accountId} got 401, re-authorizing...`);
        await this.reauthorizeAccount(accountId);
        // Retry the operation once with fresh token
        return await operation(this.clients.get(accountId));
      }
      throw err;
    }
  }

  // Wrapper for upload operations with upload URL retry on expiry
  async executeUploadWithRetry(accountId, operation) {
    const client = this.clients.get(accountId);
    if (!client) throw new Error(`B2 account ${accountId} not found`);
    
    try {
      return await operation(client);
    } catch (err) {
      // Check if it's an expired/invalid upload URL error
      // B2 returns specific errors when upload URL is expired or invalid
      const isUploadUrlExpired = err.response?.status === 400 && 
                                 (err.response?.data?.code === 'expired_auth_token' ||
                                  err.response?.data?.code === 'invalid_auth_token' ||
                                  (err.message && (err.message.includes('expired') || err.message.includes('invalid')) && err.message.includes('auth_token')));
      
      if (isUploadUrlExpired) {
        console.log(`B2 account ${accountId} upload URL expired, fetching fresh URL...`);
        await this.getUploadUrl(accountId);
        // Retry the operation once with fresh upload URL
        return await operation(this.clients.get(accountId));
      }
      throw err;
    }
  }

  // General retry wrapper with exponential backoff for transient failures
  // Retries on: network errors, 5xx, 429 - up to 3 attempts with backoff
  async executeWithGeneralRetry(accountId, operation, maxAttempts = 3) {
    const client = this.clients.get(accountId);
    if (!client) throw new Error(`B2 account ${accountId} not found`);
    
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation(client);
      } catch (err) {
        lastError = err;
        
        // Determine if error is retryable
        const isNetworkError = !err.response && (err.code === 'ECONNREFUSED' || 
                                                  err.code === 'ETIMEDOUT' || 
                                                  err.code === 'ENOTFOUND' ||
                                                  err.code === 'ENETUNREACH' ||
                                                  err.message?.includes('network') ||
                                                  err.message?.includes('timeout') ||
                                                  err.message?.includes('socket'));
        
        const isServerError = err.response?.status >= 500 && err.response?.status < 600;
        const isRateLimited = err.response?.status === 429;
        
        const isRetryable = isNetworkError || isServerError || isRateLimited;
        
        if (!isRetryable || attempt === maxAttempts) {
          throw err;
        }
        
        // Exponential backoff: 500ms, 1000ms, 2000ms...
        const delay = 500 * Math.pow(2, attempt - 1);
        console.log(`B2 account ${accountId} attempt ${attempt} failed (${err.response?.status || err.code || err.message}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  // Combined upload wrapper: general retry -> upload URL retry
  async executeUploadWithGeneralRetry(accountId, operation) {
    return this.executeWithGeneralRetry(accountId, async (client) => {
      return this.executeUploadWithRetry(accountId, operation);
    });
  }

  // Get or refresh download authorization token for an account
  async getDownloadAuthorization(accountId) {
    const client = this.clients.get(accountId);
    if (!client) throw new Error(`B2 account ${accountId} not found`);
    
    const { b2, account } = client;
    const bucketId = account.bucket_id;
    if (!bucketId) {
      throw new Error(`B2 account ${accountId} has no bucket ID stored`);
    }
    
    // Request download authorization valid for 1 hour (3600 seconds)
    const response = await b2.getDownloadAuthorization({
      bucketId,
      validDurationInSeconds: 3600,
    });
    
    const { authorizationToken } = response.data;
    const expiresAt = Date.now() + 3600 * 1000; // 1 hour from now
    
    client.downloadAuthToken = authorizationToken;
    client.downloadAuthExpiresAt = expiresAt;
    
    console.log(`B2 account ${accountId} fetched new download authorization token`);
    return authorizationToken;
  }

  // Get valid download authorization token (cached or fresh)
  async getValidDownloadAuth(accountId) {
    const client = this.clients.get(accountId);
    if (!client) throw new Error(`B2 account ${accountId} not found`);
    
    // Check if cached token is still valid (with 5 min buffer)
    if (client.downloadAuthToken && client.downloadAuthExpiresAt > Date.now() + 5 * 60 * 1000) {
      return client.downloadAuthToken;
    }
    
    // Fetch new token
    return await this.getDownloadAuthorization(accountId);
  }

  // Wrapper for download operations with download auth retry on expiry
  async executeDownloadWithRetry(accountId, operation) {
    const client = this.clients.get(accountId);
    if (!client) throw new Error(`B2 account ${accountId} not found`);
    
    // Ensure we have a valid download auth token
    const authToken = await this.getValidDownloadAuth(accountId);
    
    try {
      return await operation(client, authToken);
    } catch (err) {
      // Check if it's an expired/invalid download authorization error
      const isDownloadAuthExpired = err.response?.status === 401 || 
                                    err.response?.status === 403 ||
                                    (err.response?.data?.code && 
                                     (err.response.data.code === 'bad_auth_token' ||
                                      err.response.data.code === 'expired_auth_token')) ||
                                    (err.message && 
                                     (err.message.includes('401') || 
                                      err.message.includes('403') ||
                                      err.message.includes('bad_auth_token') ||
                                      err.message.includes('expired_auth_token')));
      
      if (isDownloadAuthExpired) {
        console.log(`B2 account ${accountId} download auth expired, fetching fresh token...`);
        // Invalidate cached token
        client.downloadAuthToken = null;
        client.downloadAuthExpiresAt = 0;
        // Fetch new token and retry once
        const newAuthToken = await this.getDownloadAuthorization(accountId);
        return await operation(this.clients.get(accountId), newAuthToken);
      }
      throw err;
    }
  }

async getAccountWithMostSpace() {
    // Single query to get all accounts with their used_bytes
    const result = await query('SELECT * FROM b2_accounts ORDER BY used_bytes ASC');
    const accounts = result.rows;
    
    for (const account of accounts) {
      const maxBytes = account.max_size_gb * 1024 * 1024 * 1024;
      const freeSpace = maxBytes - (account.used_bytes || 0);
      
      if (freeSpace > 0) {
        return account;
      }
    }
    
    return null;
  }

  // Increment used_bytes for an account after successful upload
  async incrementUsedBytes(accountId, bytes) {
    await query(
      'UPDATE b2_accounts SET used_bytes = used_bytes + $1 WHERE id = $2',
      [bytes, accountId]
    );
  }

  // Decrement used_bytes for an account after successful delete
  async decrementUsedBytes(accountId, bytes) {
    await query(
      'UPDATE b2_accounts SET used_bytes = GREATEST(used_bytes - $1, 0) WHERE id = $2',
      [bytes, accountId]
    );
  }

  // Reconcile used_bytes with actual file sizes in database
  async reconcileUsedBytes() {
    const result = await query(`
      UPDATE b2_accounts ba
      SET used_bytes = COALESCE((
        SELECT SUM(f.size) 
        FROM files f 
        WHERE f.b2_account_id = ba.id
      ), 0)
      RETURNING id, name, used_bytes
    `);
    console.log('Storage reconciliation completed:', result.rows);
    return result.rows;
  }

  // Get storage stats using cached used_bytes (fast, no SUM queries)
  async getStorageStats() {
    const accountsResult = await query('SELECT * FROM b2_accounts');
    const accounts = accountsResult.rows;
    
    const stats = [];
    let totalUsed = 0;
    let totalMax = 0;
    
    for (const account of accounts) {
      const used = account.used_bytes || 0;
      const maxBytes = account.max_size_gb * 1024 * 1024 * 1024;
      totalUsed += used;
      totalMax += maxBytes;
      
      stats.push({
        id: account.id,
        name: account.name,
        bucketName: account.bucket_name,
        bucketEndpoint: account.bucket_endpoint,
        used,
        max: maxBytes,
        free: maxBytes - used,
        percentage: maxBytes > 0 ? Math.round((used / maxBytes) * 100) : 0,
      });
    }
    
    return {
      total: { 
        used: totalUsed, 
        max: totalMax, 
        free: totalMax - totalUsed, 
        percentage: totalMax > 0 ? Math.round((totalUsed / totalMax) * 100) : 0 
      },
      accounts: stats,
    };
  }

  async uploadFile(accountId, fileName, fileBuffer, mimeType) {
    return this.executeWithRetry(accountId, async (client) => {
      // Ensure we have a valid upload URL
      if (!client.uploadUrl || !client.uploadAuthToken) {
        console.log(`B2 account ${accountId} fetching initial upload URL...`);
        await this.getUploadUrl(accountId);
      }
      
      return this.executeUploadWithGeneralRetry(accountId, async (client) => {
        const { b2, account, uploadUrl, uploadAuthToken } = client;
        const bucketId = account.bucket_id;
        if (!bucketId) {
          throw new Error(`B2 account ${accountId} has no bucket ID stored`);
        }

        const b2FileName = `${uuidv4()}-${fileName}`;
        const uploadResponse = await b2.uploadFile({
          uploadUrl,
          uploadAuthToken,
          fileName: b2FileName,
          data: fileBuffer,
          mime: mimeType,
        });

        return {
          b2FileId: uploadResponse.data.fileId,
          b2FileName: uploadResponse.data.fileName,
        };
      });
    });
  }

  async downloadFile(accountId, b2FileName) {
    return this.executeDownloadWithRetry(accountId, async (client, authToken) => {
      const { b2, account } = client;
      const response = await b2.downloadFileByName({
        bucketName: account.bucket_name,
        fileName: b2FileName,
        responseType: 'stream',
        authorization: authToken,
      });
      return response.data;
    });
  }

  async deleteFile(accountId, b2FileName, b2FileId) {
    return this.executeWithRetry(accountId, async (client) => {
      const { b2 } = client;
      await b2.deleteFileVersion({ fileName: b2FileName, fileId: b2FileId });
    });
  }

  async getFileInfo(accountId, b2FileName) {
    return this.executeWithRetry(accountId, async (client) => {
      const { b2, account } = client;
      const response = await b2.listFileNames({
        bucketName: account.bucket_name,
        prefix: b2FileName,
        maxFileCount: 1,
      });
      return response.data.files[0] || null;
    });
  }
}

export const b2Service = new B2Service();
export default b2Service;