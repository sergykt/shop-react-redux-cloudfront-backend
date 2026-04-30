import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const bucketName = process.env.BUCKET_NAME as string;

export const importProductsFile = async ({
  fileName,
}: {
  fileName?: string;
}) => {
  try {
    if (!fileName) {
      throw new Error("Missing required query parameter: fileName.");
    }

    if (!fileName.endsWith(".csv")) {
      throw new Error("Invalid file type. Only .csv files are allowed.");
    }

    const key = `uploaded/${fileName}`;
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return signedUrl;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating signed URL:", errorMessage);
    throw new Error(`Failed to import products file: ${errorMessage}`, {
      cause: error,
    });
  }
};
