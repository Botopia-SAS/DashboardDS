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
  price: number;
  duration: number; // 🔹 Duración en horas
  category: "General" | "Road Skills for Life"; // 🔹 Usamos enum para consistencia
  type: "Book" | "Buy" | "Contact"; // 🔹 Nuevo campo de tipo de producto
  buttonLabel: string; // 🔹 Texto personalizado para el botón
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