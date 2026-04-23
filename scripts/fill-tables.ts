import {
  DynamoDBClient,
  TransactWriteItem,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";
import { mockProducts } from "../src/services/product-service/mocks";
import { AvailableProduct } from "../src/services/product-service/types";

const productsTableName = "products";
const stockTableName = "stock";

const dynamoDB = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

const toProductStockTransactItems = (
  product: AvailableProduct
): TransactWriteItem[] => {
  return [
    {
      Put: {
        TableName: productsTableName,
        Item: {
          id: { S: product.id },
          title: { S: product.title },
          description: { S: product.description },
          price: { N: String(product.price) },
          img: { S: product.img },
        },
        ConditionExpression: "attribute_not_exists(id)",
      },
    },
    {
      Put: {
        TableName: stockTableName,
        Item: {
          product_id: { S: product.id },
          count: { N: String(product.count) },
        },
        ConditionExpression: "attribute_not_exists(product_id)",
      },
    },
  ];
};

const writeTransactions = async (items: TransactWriteItem[]): Promise<void> => {
  await dynamoDB.send(
    new TransactWriteItemsCommand({
      TransactItems: items,
    })
  );
};

const run = async (): Promise<void> => {
  console.log(
    `Seeding DynamoDB tables: ${productsTableName}, ${stockTableName}`
  );

  for (const product of mockProducts) {
    await writeTransactions(toProductStockTransactItems(product));
  }

  console.log("Seeding completed successfully");
};

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`Failed to seed tables: ${message}`);
  process.exit(1);
});
