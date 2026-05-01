import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { S3Event } from "aws-lambda";
import { Readable } from "stream";
import csv from "csv-parser";

const s3Client = new S3Client({ region: process.env.AWS_REGION });

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
        .on("data", (row) => {
          console.log("Parsed row:", JSON.stringify(row));
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
