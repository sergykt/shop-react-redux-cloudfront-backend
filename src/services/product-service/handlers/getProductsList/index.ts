import { mockProducts } from "../../mocks";

export const getProductsList = async () => {
  try {
    return mockProducts;
  } catch {
    throw new Error("Failed to retrieve products list.");
  }
};
