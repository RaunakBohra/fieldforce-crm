import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

const ACCOUNT_ID = '610762493d34333f1a6d72a037b345cf';
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

const bucketsToDelete = [
  'iwishbag-email-attachments',
  'iwishbag-emails-r2',
  'iwishbag-emails-unified',
  'iwishbag-new'
];

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

async function emptyBucket(bucketName) {
  console.log(`\nEmptying bucket: ${bucketName}`);
  let continuationToken = undefined;
  let totalDeleted = 0;

  do {
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      ContinuationToken: continuationToken,
    });

    const listResponse = await s3Client.send(listCommand);

    if (listResponse.Contents && listResponse.Contents.length > 0) {
      const objectsToDelete = listResponse.Contents.map(obj => ({ Key: obj.Key }));

      const deleteCommand = new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
          Objects: objectsToDelete,
        },
      });

      await s3Client.send(deleteCommand);
      totalDeleted += objectsToDelete.length;
      console.log(`  Deleted ${objectsToDelete.length} objects (total: ${totalDeleted})`);
    }

    continuationToken = listResponse.IsTruncated ? listResponse.NextContinuationToken : undefined;
  } while (continuationToken);

  console.log(`✓ Emptied ${bucketName} - Total objects deleted: ${totalDeleted}`);
}

async function main() {
  if (!ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
    console.error('Error: R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY environment variables are required');
    console.error('\nYou need to create R2 API tokens from Cloudflare dashboard:');
    console.error('1. Go to https://dash.cloudflare.com');
    console.error('2. Navigate to R2 → Overview → Manage R2 API Tokens');
    console.error('3. Create a token with Admin Read & Write permissions');
    console.error('4. Run: export R2_ACCESS_KEY_ID=xxx R2_SECRET_ACCESS_KEY=xxx');
    process.exit(1);
  }

  console.log('Starting R2 bucket cleanup...\n');

  for (const bucket of bucketsToDelete) {
    try {
      await emptyBucket(bucket);
    } catch (error) {
      console.error(`✗ Error emptying ${bucket}:`, error.message);
    }
  }

  console.log('\n✓ All buckets emptied!');
  console.log('\nNow deleting the empty buckets...');
  console.log('Run the following commands:\n');

  bucketsToDelete.forEach(bucket => {
    console.log(`npx wrangler r2 bucket delete ${bucket}`);
  });
}

main().catch(console.error);
