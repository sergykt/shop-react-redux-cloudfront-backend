import { mockProducts } from "../../mocks";
import { getProductsById } from "../getProductsById";

describe("getProductsById", () => {
  it("returns the correct product for a valid id", async () => {
    const event = { productId: mockProducts[0].id };

    const result = await getProductsById(event);

    expect(result).toEqual(mockProducts[0]);
  });

  it("returns the correct product for any valid id in the list", async () => {
    const target = mockProducts[3];
    const event = { productId: target.id };

    const result = await getProductsById(event);

    expect(result.id).toBe(target.id);
    expect(result.title).toBe(target.title);
  });

  it("throws 'not found' error when product id does not exist", async () => {
    const event = { productId: "non-existent-id" };

    await expect(getProductsById(event)).rejects.toThrow(
      "Product with ID non-existent-id not found."
    );
  });

  it("error message includes the missing product id", async () => {
    const missingId = "missing-42";
    const event = { productId: missingId };

    await expect(getProductsById(event)).rejects.toThrow(missingId);
  });

  it("throws error when productId is missing", async () => {
    const event = {} as unknown as { productId: string };

    await expect(getProductsById(event)).rejects.toThrow(
      "Product ID is required."
    );
  });
});
