import { S3Client, PutObjectCommand, ListObjectsV2Command, ListObjectsV2CommandInput, GetObjectCommand, DeleteObjectsCommand, ListObjectsV2CommandOutput } from "@aws-sdk/client-s3";

/**
 * Uploads a file to an S3 bucket.
 * @param bucketName The name of the S3 bucket.
 * @param key The key of the file in the S3 bucket.
 * @param fileStream A string containing the file data.
 * @param contentType The content type of the file.
 */
export async function uploadFileToS3(
  bucketName: string,
  key: string,
  fileStream: string,
  contentType: string
): Promise<void> {
  // Create S3 client
  const s3Client = new S3Client({ region: process.env.AWS_DEFAULT_REGION});

  // Create parameters for the PutObjectCommand
  const uploadParams = {
    Bucket: bucketName,
    Key: key,
    Body: fileStream,
    ContentType: contentType,
  };

  try {
    // Upload the file to S3
    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);
    console.log("✅ File uploaded successfully.");
  } catch (error) {
    console.error("❌ Error uploading file:", error);
    throw error;
  }
}

/**
 * List files in an S3 bucket with pagination support
 * @param bucketName Name of the S3 bucket
 * @param prefix Path within the bucket
 * @returns Array of file keys
 */
export async function listFilesInBucket(bucketName: string, prefix: string): Promise<string[]> {
  const s3Client = new S3Client({ region: process.env.AWS_DEFAULT_REGION });
  const params = {
    Bucket: bucketName,
    Prefix: prefix
  };

  let isTruncated = true;
  let continuationToken: string | undefined = undefined;
  const allFiles: string[] = [];

  while (isTruncated) {
    try {
      const commandInput = {
        ...params,
        ContinuationToken: continuationToken
      };
      const data: ListObjectsV2CommandOutput = await s3Client.send(new ListObjectsV2Command(commandInput));
      if (data.Contents !== undefined) {
        const files = data.Contents.map(obj => obj.Key);
        if(files.length > 0){
          for (const file of files) {
            if (file !== undefined) {
              allFiles.push(file);
            }
          }
        }
      }
      isTruncated = data.IsTruncated === true;
      continuationToken = data.NextContinuationToken;
    } catch (err) {
      console.error("Error listing objects", err);
      throw err;
    }
  }
  
  return allFiles;
}

/**
 * Get Content of File in s3
 * @param bucketName The name of the S3 bucket
 * @param fileName Name of the File
 * @returns 
 */
export async function getFileContent(bucketName: string, fileName: string) {
  // Create S3 client
  const s3Client = new S3Client({ region: process.env.AWS_DEFAULT_REGION});
  const params = {
    Bucket: bucketName,
    Key: fileName
  };

  try {
    const data = await s3Client.send(new GetObjectCommand(params));
    const buffer = Buffer.from(await data.Body!.transformToByteArray());
    return buffer.toString();
  } catch (err) {
    console.error("❌ Error getting object", err);
    throw err;
  }
}



/**
 *  Delete Files under specified Prefix in s3 Bucket
 * @param bucketName The name of the S3 bucket.
 * @param prefix The path of the file in the S3 bucket.
 */
export async function deleteS3FilesWithPrefix(bucketName: string , prefix:string) {
  const s3Client = new S3Client({ region: process.env.AWS_DEFAULT_REGION });
  let continuationToken = undefined;

  do {
    const params: ListObjectsV2CommandInput = {
      Bucket: bucketName,
      Prefix: prefix,
      ContinuationToken: continuationToken
    };

    const listObjectsCommand = new ListObjectsV2Command(params);
    const listResponse  = await s3Client.send(listObjectsCommand);

    if (listResponse.Contents && listResponse.Contents.length > 0) {
      const deleteParams = {
        Bucket: bucketName,
        Delete: {
          Objects: listResponse.Contents.map(({ Key }) => ({ Key })),
          Quiet: false
        }
      };

      await s3Client.send(new DeleteObjectsCommand(deleteParams));
    }

    continuationToken = listResponse.ContinuationToken ? listResponse.ContinuationToken : undefined;
  } while (continuationToken);
}