// B2 API wrapper - handles all Backblaze B2 API calls
const { B2 } = require('backblaze-b2');

class B2Service {
  constructor(accountConfig) {
    this.accountConfig = accountConfig;
    this.b2 = new B2({
      applicationKeyId: accountConfig.keyId,
      applicationKey: accountConfig.applicationKey,
    });
    this.authorized = false;
  }

  async authorize() {
    if (!this.authorized) {
      await this.b2.authorize();
      this.authorized = true;
    }
  }

  async getUploadUrl() {
    await this.authorize();
    const response = await this.b2.getUploadUrl({ bucketId: this.accountConfig.bucketId });
    return response.data;
  }

  async uploadFile(uploadUrl, uploadAuthToken, fileName, fileData, mimeType) {
    await this.authorize();
    const response = await this.b2.uploadFile({
      uploadUrl,
      uploadAuthToken,
      fileName,
      data: fileData,
      mime: mimeType,
    });
    return response.data;
  }

  async downloadFileByName(fileName) {
    await this.authorize();
    const response = await this.b2.downloadFileByName({
      bucketName: this.accountConfig.bucketName,
      fileName,
      responseType: 'stream',
    });
    return response.data;
  }

  async deleteFileVersion(fileName, fileId) {
    await this.authorize();
    await this.b2.deleteFileVersion({ fileName, fileId });
  }

  async listFiles() {
    await this.authorize();
    const response = await this.b2.listFileNames({
      bucketName: this.accountConfig.bucketName,
      maxFileCount: 1000,
    });
    return response.data.files;
  }

  async getBucketUsage() {
    await this.authorize();
    const response = await this.b2.listFileNames({
      bucketName: this.accountConfig.bucketName,
      maxFileCount: 10000,
    });
    const totalSize = response.data.files.reduce((sum, f) => sum + (f.contentLength || 0), 0);
    return totalSize;
  }
}

module.exports = { B2Service };