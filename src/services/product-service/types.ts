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
