import ProductDetails from "@/components/products/ProductDetails"; // Importamos el Client Component

export default async function ProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params; // ✅ Esperar `params` antes de extraer `productId`

  return <ProductDetails productId={productId} />; // 🔥 Pasamos `productId` como prop
}
