import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { AvailableProduct } from "../../types";

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const productsTableName = process.env.PRODUCTS_TABLE_NAME as string;
const stockTableName = process.env.STOCK_TABLE_NAME as string;

export const getProductsList = async (): Promise<AvailableProduct[]> => {
  try {
    if (!productsTableName || !stockTableName) {
      throw new Error("DynamoDB table environment variables are not set.");
    }

    console.log("Retrieving products list...");

    const [productsScanResult, stockScanResult] = await Promise.all([
      dynamoDB.send(new ScanCommand({ TableName: productsTableName })),
      dynamoDB.send(new ScanCommand({ TableName: stockTableName })),
    ]);

    const productsItems = productsScanResult.Items ?? [];
    const stockItems = stockScanResult.Items ?? [];

    const stockMap: Record<string, number> = {};
    for (const stockItem of stockItems) {
      const productId = stockItem.product_id.S;
      const count = parseInt(stockItem.count.N ?? "0", 10);
      if (productId) {
        stockMap[productId] = count;
      }
    }

    return productsItems.map((productItem) => {
      const id = productItem.id.S ?? "";
      const title = productItem.title.S ?? "";
      const description = productItem.description.S ?? "";
      const price = parseFloat(productItem.price.N ?? "0");
      const count = stockMap[id] ?? 0;
      const img = productItem.img.S ?? "";

      return { id, title, description, price, count, img };
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error("Error retrieving products list:", errorMessage);

    throw new Error(`Failed to retrieve products list: ${errorMessage}`, {
      cause: error,
    });
  }
};
