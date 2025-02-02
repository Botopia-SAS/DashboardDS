import ProductDetails from "@/components/products/ProductDetails"; // Importamos el Client Component

export default async function ProductPage({ params }: { params: { productId: string } }) {
  const { productId } = await params; // ✅ Asegurar que params se obtiene bien

  return <ProductDetails productId={productId} />; // 🔥 Pasamos `productId` como prop al Client Component
}
