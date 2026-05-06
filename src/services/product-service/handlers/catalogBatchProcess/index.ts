import { SQSBatchItemFailure, SQSBatchResponse, SQSEvent } from "aws-lambda";
import { createProduct } from "../createProduct";
import { CreateProductPayload } from "../../types";
import { ValidationError } from "../../errors";

export const catalogBatchProcess = async (
  event: SQSEvent
): Promise<SQSBatchResponse> => {
  // Array to hold failed item identifiers for batch processing
  const batchItemFailures: SQSBatchItemFailure[] = [];

  for (const record of event.Records) {
    try {
      const payload = JSON.parse(record.body) as CreateProductPayload;
      await createProduct(payload);
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
