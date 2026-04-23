import {
  BatchWriteItemCommand,
  DynamoDBClient,
  WriteRequest,
} from "@aws-sdk/client-dynamodb";
import { mockProducts } from "../src/services/product-service/mocks";

const productsTableName = "products";
const stockTableName = "stock";

const dynamoDB = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const writeBatch = async (
  tableName: string,
  requests: WriteRequest[]
): Promise<void> => {
  const response = await dynamoDB.send(
    new BatchWriteItemCommand({
      RequestItems: {
        [tableName]: requests,
      },
    })
  );
  const unprocessedCount = response.UnprocessedItems?.[tableName]?.length ?? 0;

  if (unprocessedCount > 0) {
    console.warn(
      `Inserted into ${tableName} with ${unprocessedCount} unprocessed items`
    );
  } else {
    console.log(`Inserted ${requests.length} items into ${tableName}`);
  }
};

const toProductWriteRequests = (): WriteRequest[] => {
  return mockProducts.map((product) => ({
    PutRequest: {
      Item: {
        id: { S: product.id },
        title: { S: product.title },
        description: { S: product.description },
        price: { N: String(product.price) },
        img: { S: product.img },
      },
    },
  }));
};

const toStockWriteRequests = (): WriteRequest[] => {
  return mockProducts.map((product) => ({
    PutRequest: {
      Item: {
        product_id: { S: product.id },
        count: { N: String(product.count) },
      },
    },
  }));
};

const run = async (): Promise<void> => {
  console.log(
    `Seeding DynamoDB tables: ${productsTableName}, ${stockTableName}`
  );

  await writeBatch(productsTableName, toProductWriteRequests());
  await writeBatch(stockTableName, toStockWriteRequests());

  console.log("Seeding completed successfully");
};

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`Failed to seed tables: ${message}`);
  process.exit(1);
});
