// Reads 5 B2 accounts from environment variables
// Each account needs: KEY_ID, APPLICATION_KEY, BUCKET_ID, BUCKET_NAME, BUCKET_REGION

export function getB2Accounts() {
  const accounts = [];
  
  for (let i = 1; i <= 5; i++) {
    const keyId = process.env[`B2_${i}_KEY_ID`];
    const applicationKey = process.env[`B2_${i}_APPLICATION_KEY`];
    const bucketId = process.env[`B2_${i}_BUCKET_ID`];
    const bucketName = process.env[`B2_${i}_BUCKET_NAME`];
    const bucketRegion = process.env[`B2_${i}_BUCKET_REGION`] || 'us-west-000';
    
    if (keyId && applicationKey && bucketId && bucketName) {
      accounts.push({
        index: i,
        keyId,
        applicationKey,
        bucketId,
        bucketName,
        bucketRegion,
        maxSizeGB: 10,
        usedSpace: 0
      });
    }
  }
  
  return accounts;
}