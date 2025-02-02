type CollectionType = {
  _id: string;
  title: string;
  description: string;
  image: string;
  products: ProductType[];
}

type ProductType = {
  _id: string;
  title: string;
  description: string;
  hasImage: boolean; // 🔹 Nuevo campo booleano
  media: string[]; // 🔹 Ahora soporta múltiples imágenes
  category: "General" | "Road Skills for Life"; // 🔹 Usamos enum para consistencia
  type: "Book" | "Buy"; // 🔹 Nuevo campo de tipo de producto
  buttonLabel: string; // 🔹 Texto personalizado para el botón
  category: string;
  collections: [CollectionType];
  tags: [string];
  sizes: [string];
  colors: [string];
  price: number;
  expense: number;
  createdAt: Date;
  updatedAt: Date;
}

type OrderColumnType = {
  _id: string;
  customer: string;
  products: number;
  totalAmount: number;
  createdAt: string;
}

type OrderItemType = {
  product: ProductType
  color: string;
  size: string;
  quantity: number;
}

type CustomerType = {
  clerkId: string;
  name: string;
  email: string;
}