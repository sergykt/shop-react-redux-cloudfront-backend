import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { AvailableProduct } from "../../types";

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const productsTableName = process.env.PRODUCTS_TABLE_NAME as string;
const stockTableName = process.env.STOCK_TABLE_NAME as string;

export const getProductsById = async ({
  productId,
}: {
  productId?: string;
}): Promise<AvailableProduct> => {
  try {
    if (!productsTableName || !stockTableName) {
      throw new Error("DynamoDB table environment variables are not set.");
    }

    console.log(`Retrieving product with ID: ${productId} ...`);

    if (!productId) {
      throw new Error("Product ID is required in the path parameters.");
    }

    const [productResult, stockResult] = await Promise.all([
      dynamoDB.send(
        new GetItemCommand({
          TableName: productsTableName,
          Key: { id: { S: productId } },
        })
      ),
      dynamoDB.send(
        new GetItemCommand({
          TableName: stockTableName,
          Key: { product_id: { S: productId } },
        })
      ),
    ]);

    const productItem = productResult.Item;
    const stockItem = stockResult.Item;

    if (!productItem) {
      throw new Error(`Product with ID ${productId} not found.`);
    }

    const id = productItem.id.S ?? "";
    const title = productItem.title.S ?? "";
    const description = productItem.description.S ?? "";
    const price = parseFloat(productItem.price.N ?? "0");
    const count = stockItem ? parseInt(stockItem.count.N ?? "0", 10) : 0;
    const img = productItem.img.S ?? "";

    return { id, title, description, price, count, img };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error("Error retrieving product by ID:", errorMessage);

    throw new Error(`Failed to retrieve product by ID: ${errorMessage}`, {
      cause: error,
    });
  }
};
