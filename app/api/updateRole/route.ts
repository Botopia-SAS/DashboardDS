import { NextRequest, NextResponse } from "next/server";
import { createClerkClient } from "@clerk/backend";

// 🔹 Instanciar Clerk con la `secretKey`
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function POST(request: NextRequest) {
  try {
    // 🔹 Obtener los datos enviados en la solicitud
    const { email, newRole } = await request.json();

    // 🔹 Buscar el usuario en Clerk por correo
    const users = await clerk.users.getUserList({ emailAddress: [email] });

    if (!users || users.data.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const targetUserId = users.data[0].id; // Obtener el ID del usuario encontrado

    // 🔹 Actualizar el rol en `publicMetadata`
    await clerk.users.updateUserMetadata(targetUserId, {
      publicMetadata: { role: newRole },
    });

    return NextResponse.json({
      message: `✅ Rol actualizado a ${newRole} para ${email}`,
    });
  } catch (error) {
    console.error("Error actualizando el rol:", error);
    return NextResponse.json(
      { error: "❌ Error actualizando el rol" },
      { status: 500 }
    );
  }
}
