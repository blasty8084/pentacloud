const B2 = require('backblaze-b2');
const db = require('../db/init.js').default;
const { v4: uuidv4 } = require('uuid');

class B2Service {
  constructor() {
    this.clients = new Map();
    this.accounts = [];
  }

  async initialize() {
    this.accounts = db.prepare('SELECT * FROM b2_accounts').all();
    for (const account of this.accounts) {
      const b2 = new B2({
        applicationKeyId: account.key_id,
        applicationKey: account.application_key,
      });
      await b2.authorize();
      this.clients.set(account.id, { b2, account });
    }
    console.log(`Initialized ${this.accounts.length} B2 accounts`);
  }

  getAccountWithMostSpace() {
    let bestAccount = null;
    let mostFreeSpace = -1;

    for (const account of this.accounts) {
      const usedResult = db.prepare('SELECT COALESCE(SUM(size), 0) as used FROM files WHERE b2_account_id = ?').get(account.id);
      const used = usedResult.used || 0;
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
    const client = this.clients.get(accountId);
    if (!client) throw new Error(`B2 account ${accountId} not found`);

    const { b2, account } = client;
    const uploadUrlResponse = await b2.getUploadUrl({ bucketId: account.bucket_id });
    const { uploadUrl, authorizationToken } = uploadUrlResponse.data;

    const b2FileName = `${uuidv4()}-${fileName}`;
    const uploadResponse = await b2.uploadFile({
      uploadUrl,
      uploadAuthToken: authorizationToken,
      fileName: b2FileName,
      data: fileBuffer,
      mime: mimeType,
    });

    return {
      b2FileId: uploadResponse.data.fileId,
      b2FileName: uploadResponse.data.fileName,
    };
  }

  async downloadFile(accountId, b2FileName) {
    const client = this.clients.get(accountId);
    if (!client) throw new Error(`B2 account ${accountId} not found`);

    const { b2, account } = client;
    const response = await b2.downloadFileByName({
      bucketName: account.bucket_name,
      fileName: b2FileName,
      responseType: 'stream',
    });

    return response.data;
  }

  async deleteFile(accountId, b2FileName, b2FileId) {
    const client = this.clients.get(accountId);
    if (!client) throw new Error(`B2 account ${accountId} not found`);

    const { b2 } = client;
    await b2.deleteFileVersion({ fileName: b2FileName, fileId: b2FileId });
  }

  async getFileInfo(accountId, b2FileName) {
    const client = this.clients.get(accountId);
    if (!client) throw new Error(`B2 account ${accountId} not found`);

    const { b2, account } = client;
    const response = await b2.listFileNames({
      bucketName: account.bucket_name,
      prefix: b2FileName,
      maxFileCount: 1,
    });

    return response.data.files[0] || null;
  }

  getStorageStats() {
    const stats = [];
    for (const account of this.accounts) {
      const usedResult = db.prepare('SELECT COALESCE(SUM(size), 0) as used FROM files WHERE b2_account_id = ?').get(account.id);
      const used = usedResult.used || 0;
      const maxBytes = account.max_size_gb * 1024 * 1024 * 1024;
      stats.push({
        id: account.id,
        name: account.name,
        bucketName: account.bucket_name,
        used,
        max: maxBytes,
        free: maxBytes - used,
        percentage: maxBytes > 0 ? Math.round((used / maxBytes) * 100) : 0,
      });
    }
    return stats;
  }
}

const b2Service = new B2Service();
module.exports = b2Service;