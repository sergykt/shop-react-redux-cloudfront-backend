import { mockProducts } from "../../mocks";

export const getProductsById = async ({ productId }: { productId: string }) => {
  if (!productId) {
    throw new Error("Product ID is required.");
  }

  const product = mockProducts.find((item) => item.id === productId);

  if (!product) {
    throw new Error(`Product with ID ${productId} not found.`);
  }

  return product;
};
