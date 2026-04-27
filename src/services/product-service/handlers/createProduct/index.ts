import { randomUUID } from "crypto";
import {
  DynamoDBClient,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";
import { AvailableProduct, CreateProductPayload } from "../../types";

type ValidatedCreateProductPayload = Required<CreateProductPayload>;

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });

const validatePayload = (
  payload: CreateProductPayload
): ValidatedCreateProductPayload => {
  const { title, description, price, count, img } = payload;
  const validationErrors: string[] = [];

  if (typeof title !== "string" || title.trim().length === 0) {
    validationErrors.push("title is required");
  }

  if (typeof description !== "string") {
    validationErrors.push("description must be a string");
  }

  if (img && typeof img !== "string") {
    validationErrors.push("img must be a string");
  }

  if (typeof price !== "number" || price < 0) {
    validationErrors.push("price must be a non-negative number");
  }

  if (typeof count !== "number" || !Number.isInteger(count) || count < 0) {
    validationErrors.push("count must be a non-negative integer");
  }

  if (validationErrors.length > 0) {
    throw new Error(`Invalid product payload: ${validationErrors.join("; ")}.`);
  }

  return {
    title: title.trim(),
    description: description.trim(),
    img: img || "",
    price,
    count,
  };
};

export const createProduct = async (
  payload: CreateProductPayload
): Promise<AvailableProduct> => {
  try {
    const productsTableName = process.env.PRODUCTS_TABLE_NAME;
    const stockTableName = process.env.STOCK_TABLE_NAME;

    if (!productsTableName || !stockTableName) {
      throw new Error("DynamoDB table environment variables are not set.");
    }

    console.log("Creating new product, payload:", payload);

    const { title, description, img, price, count } = validatePayload(payload);
    const productId = randomUUID();

    const productItem = {
      id: { S: productId },
      title: { S: title },
      description: { S: description },
      price: { N: String(price) },
      img: { S: img },
    };

    const stockItem = {
      product_id: { S: productId },
      count: { N: String(count) },
    };

    await dynamoDB.send(
      new TransactWriteItemsCommand({
        TransactItems: [
          {
            Put: {
              TableName: productsTableName,
              Item: productItem,
              ConditionExpression: "attribute_not_exists(id)",
            },
          },
          {
            Put: {
              TableName: stockTableName,
              Item: stockItem,
              ConditionExpression: "attribute_not_exists(product_id)",
            },
          },
        ],
      })
    );

    return {
      id: productId,
      title,
      description,
      price,
      count,
      img,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error("Error creating product:", errorMessage);

    throw new Error(`Failed to create product: ${errorMessage}`, {
      cause: error,
    });
  }
};
