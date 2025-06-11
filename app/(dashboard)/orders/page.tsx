import React from 'react'
import Order from '@/lib/models/Order'
import dbConnect from '@/lib/dbConnect'
import OrdersTable from './OrdersTable'
import User from '@/lib/models/users'

interface SerializedOrderItem {
  id: string
  title: string
  price: number
  quantity: number
  _id: string
}

interface SerializedOrder {
  _id: string
  orderNumber: string | number
  estado: string
  createdAt: string
  total: number
  user: {
    firstName: string
    lastName: string
    email: string
  }
  items: SerializedOrderItem[]
  __v: number
}

function serializeOrder(order: any, user: any): SerializedOrder {
  return {
    _id: order._id?.toString?.() ?? '',
    orderNumber: order.orderNumber ?? '',
    estado: order.estado ?? order.status ?? '',
    createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : '',
    total: order.total ?? 0,
    user: user
      ? {
          firstName: user.firstName || '-',
          lastName: user.lastName || '-',
          email: user.email || '-',
        }
      : { firstName: '-', lastName: '-', email: '-' },
    items: Array.isArray(order.items)
      ? order.items.map((item: any): SerializedOrderItem => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          _id: item._id?.toString?.() ?? '',
        }))
      : [],
    __v: order.__v ?? 0,
  }
}

const Page = async () => {
  await dbConnect()
  let orders = await Order.find({}).lean()
  // Obtener todos los userIds únicos
  const userIds = Array.from(new Set(orders.map((o: any) => o.userId?.toString?.() ?? o.user_id?.toString?.()))).filter(Boolean)
  // Buscar todos los usuarios de una vez
  const usersArr = await User.find({ _id: { $in: userIds } }).lean()
  const usersMap = Object.fromEntries(usersArr.map((u: any) => [u._id.toString(), u]))
  // Serializar y asociar usuario correcto
  orders = orders.map((order: any) => {
    const userId = order.userId?.toString?.() ?? order.user_id?.toString?.()
    const user = usersMap[userId]
    return serializeOrder(order, user)
  })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Orders</h1>
      <OrdersTable orders={orders} />
    </div>
  )
}

export default Page