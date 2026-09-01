// Router service - picks which B2 account gets the file based on available space
const { B2Service } = require('./b2Service');
const { getB2Accounts } = require('../config/b2accounts');

class RouterService {
  constructor() {
    this.accounts = [];
    this.services = new Map();
  }

  async initialize() {
    const accountConfigs = getB2Accounts();
    this.accounts = accountConfigs.map(config => ({
      ...config,
      usedSpace: 0
    }));

    for (const account of this.accounts) {
      const service = new B2Service(account);
      this.services.set(account.index, service);
    }

    // Calculate initial usage for each account
    await this.updateUsageStats();
    console.log(`Router initialized with ${this.accounts.length} B2 accounts`);
  }

  async updateUsageStats() {
    for (const account of this.accounts) {
      const service = this.services.get(account.index);
      if (service) {
        try {
          const usedSpace = await service.getBucketUsage();
          account.usedSpace = usedSpace;
        } catch (err) {
          console.error(`Failed to get usage for account ${account.index}:`, err.message);
          account.usedSpace = 0;
        }
      }
    }
  }

  getAccountWithMostSpace() {
    let bestAccount = null;
    let mostFreeSpace = -1;

    for (const account of this.accounts) {
      const maxBytes = account.maxSizeGB * 1024 * 1024 * 1024;
      const freeSpace = maxBytes - account.usedSpace;
      
      if (freeSpace > mostFreeSpace) {
        mostFreeSpace = freeSpace;
        bestAccount = account;
      }
    }

    return bestAccount;
  }

  async uploadFile(fileName, fileData, mimeType) {
    const account = this.getAccountWithMostSpace();
    if (!account) {
      throw new Error('No B2 accounts available or all full');
    }

    const maxBytes = account.maxSizeGB * 1024 * 1024 * 1024;
    if (account.usedSpace + fileData.length > maxBytes) {
      throw new Error(`Account ${account.index} has insufficient space`);
    }

    const service = this.services.get(account.index);
    const { uploadUrl, authorizationToken } = await service.getUploadUrl();
    
    const uniqueFileName = `${Date.now()}-${fileName}`;
    const result = await service.uploadFile(
      uploadUrl,
      authorizationToken,
      uniqueFileName,
      fileData,
      mimeType
    );

    // Update local usage stats
    account.usedSpace += fileData.length;

    return {
      ...result,
      accountIndex: account.index,
      accountName: `Account-${account.index}`,
      storedFileName: uniqueFileName
    };
  }

  async downloadFile(accountIndex, fileName) {
    const service = this.services.get(accountIndex);
    if (!service) {
      throw new Error(`B2 account ${accountIndex} not found`);
    }
    return service.downloadFileByName(fileName);
  }

  async deleteFile(accountIndex, fileName, fileId) {
    const service = this.services.get(accountIndex);
    if (!service) {
      throw new Error(`B2 account ${accountIndex} not found`);
    }
    await service.deleteFileVersion(fileName, fileId);
  }

  getStorageStats() {
    return this.accounts.map(account => ({
      index: account.index,
      name: `Account-${account.index}`,
      bucketName: account.bucketName,
      usedSpace: account.usedSpace,
      maxSpace: account.maxSizeGB * 1024 * 1024 * 1024,
      freeSpace: (account.maxSizeGB * 1024 * 1024 * 1024) - account.usedSpace,
      percentage: Math.round((account.usedSpace / (account.maxSizeGB * 1024 * 1024 * 1024)) * 100)
    }));
  }

  getTotalStats() {
    const stats = this.getStorageStats();
    const totalUsed = stats.reduce((sum, s) => sum + s.usedSpace, 0);
    const totalMax = stats.reduce((sum, s) => sum + s.maxSpace, 0);
    return {
      total: {
        used: totalUsed,
        max: totalMax,
        free: totalMax - totalUsed,
        percentage: totalMax > 0 ? Math.round((totalUsed / totalMax) * 100) : 0
      },
      accounts: stats
    };
  }
}

const routerService = new RouterService();
module.exports = { routerService };