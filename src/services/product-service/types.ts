export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  img: string;
};

export type AvailableProduct = Product & {
  count: number;
};

export type CreateProductPayload = {
  title: string;
  description: string;
  price: number;
  count: number;
  img?: string;
};
