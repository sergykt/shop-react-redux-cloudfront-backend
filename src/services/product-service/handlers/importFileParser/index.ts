import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { S3Event } from "aws-lambda";
import { Readable } from "stream";
import csv from "csv-parser";

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

const queueUrl = process.env.CATALOG_ITEMS_QUEUE_URL as string;

const normalizeRow = (row: Record<string, string>): Record<string, unknown> => {
  return {
    ...row,
    price: Number(row.price),
    count: Number(row.count),
  };
};

export const importFileParser = async (event: S3Event): Promise<void> => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    console.log(`Parsing file: s3://${bucket}/${key}`);

    const { Body } = await s3Client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );

    await new Promise<void>((resolve, reject) => {
      (Body as Readable)
        .pipe(csv())
        .on("data", async (row) => {
          await sqsClient.send(
            new SendMessageCommand({
              QueueUrl: queueUrl,
              MessageBody: JSON.stringify(normalizeRow(row)),
            })
          );
        })
        .on("end", () => {
          console.log(`Finished parsing: ${key}`);
          resolve();
        })
        .on("error", reject);
    });

    // S3 has no native move - copy then delete is the only way
    const destinationKey = key.replace("uploaded/", "parsed/");
    await s3Client.send(
      new CopyObjectCommand({
        Bucket: bucket,
        CopySource: `${bucket}/${key}`,
        Key: destinationKey,
      })
    );
    await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    console.log(`Moved file to: s3://${bucket}/${destinationKey}`);
  }
};
