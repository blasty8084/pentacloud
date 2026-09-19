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
        this.clients.set(account.id, { b2, account, uploadUrl: null, uploadAuthToken: null });
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

  async getAccountWithMostSpace() {
    let bestAccount = null;
    let mostFreeSpace = -1;

    for (const account of this.accounts) {
      const usedResult = await query('SELECT COALESCE(SUM(size), 0) as used FROM files WHERE b2_account_id = $1', [account.id]);
      const used = parseInt(usedResult.rows[0].used) || 0;
      const maxBytes = account.max_size_gb * 1024 * 1024 * 1024;
      const freeSpace = maxBytes - used;

      if (freeSpace > mostFreeSpace) {
        mostFreeSpace = freeSpace;
        bestAccount = account;
      }
    }

    return bestAccount;
  }

  async uploadFile(accountId, fileName, fileBuffer, mimeType) {
    return this.executeWithRetry(accountId, async (client) => {
      // Ensure we have a valid upload URL
      if (!client.uploadUrl || !client.uploadAuthToken) {
        console.log(`B2 account ${accountId} fetching initial upload URL...`);
        await this.getUploadUrl(accountId);
      }
      
      return this.executeUploadWithRetry(accountId, async (client) => {
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
    return this.executeWithRetry(accountId, async (client) => {
      const { b2, account } = client;
      const response = await b2.downloadFileByName({
        bucketName: account.bucket_name,
        fileName: b2FileName,
        responseType: 'stream',
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

  async getStorageStats() {
    const stats = [];
    for (const account of this.accounts) {
      const usedResult = await query('SELECT COALESCE(SUM(size), 0) as used FROM files WHERE b2_account_id = $1', [account.id]);
      const used = parseInt(usedResult.rows[0].used) || 0;
      const maxBytes = account.max_size_gb * 1024 * 1024 * 1024;
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
    return stats;
  }
}

export const b2Service = new B2Service();
export default b2Service;