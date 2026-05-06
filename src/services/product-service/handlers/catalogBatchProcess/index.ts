import { SQSBatchItemFailure, SQSBatchResponse, SQSEvent } from "aws-lambda";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { createProduct } from "../createProduct";
import { CreateProductPayload } from "../../types";
import { ValidationError } from "../../errors";

const snsClient = new SNSClient({ region: process.env.AWS_REGION });
const createProductTopicArn = process.env.CREATE_PRODUCT_TOPIC_ARN as string;

export const catalogBatchProcess = async (
  event: SQSEvent
): Promise<SQSBatchResponse> => {
  // Array to hold failed item identifiers for batch processing
  const batchItemFailures: SQSBatchItemFailure[] = [];

  for (const record of event.Records) {
    try {
      const payload = JSON.parse(record.body) as CreateProductPayload;
      await createProduct(payload);

      // Publish a message to the SNS topic for product creation events
      await snsClient.send(
        new PublishCommand({
          TopicArn: createProductTopicArn,
          Subject: "New Product(s) Created",
          Message: JSON.stringify(payload, null, 2),
        })
      );
    } catch (error) {
      console.error("Error processing record:", record, "Error:", error);

      // Only mark the item as failed if it's not a validation error, allowing retries for transient issues
      if (!(error instanceof ValidationError)) {
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    }
  }

  // Return the batch response with any failed item identifiers
  return { batchItemFailures };
};
