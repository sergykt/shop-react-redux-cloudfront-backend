import { mockProducts } from "../../mocks";
import { getProductsList } from "../getProductsList";

describe("getProductsList", () => {
  it("returns the full list of products", async () => {
    const result = await getProductsList();

    expect(result).toEqual(mockProducts);
  });

  it("returns a non-empty array", async () => {
    const result = await getProductsList();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("each product has required fields: id, title, description, price", async () => {
    const result = await getProductsList();

    for (const product of result) {
      expect(product).toHaveProperty("id");
      expect(product).toHaveProperty("title");
      expect(product).toHaveProperty("description");
      expect(product).toHaveProperty("price");
    }
  });
});
