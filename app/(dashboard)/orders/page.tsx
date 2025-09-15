import React from 'react'
import Order from '@/lib/models/Order'
import dbConnect from '@/lib/dbConnect'
import OrdersTable from '@/components/OrdersTable'
import User from '@/lib/models/users'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, ShoppingCart, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'

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

interface OrderDocument {
  _id: any
  orderNumber?: string | number
  estado?: string
  status?: string
  createdAt?: Date
  total?: number
  userId?: any
  user_id?: any
  items?: Array<{
    id: string
    title: string
    price: number
    quantity: number
    _id: any
  }>
  __v?: number
}

interface UserDocument {
  _id: any
  firstName?: string
  lastName?: string
  email?: string
}

function serializeOrder(order: OrderDocument, user: UserDocument | null): SerializedOrder {
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
      ? order.items.map((item): SerializedOrderItem => ({
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
  const orders = await Order.find({}).lean() as OrderDocument[]
  // Get all unique userIds
  const userIds = Array.from(new Set(orders.map((o: OrderDocument) => o.userId?.toString?.() ?? o.user_id?.toString?.()))).filter(Boolean)
  // Find all users at once
  const usersArr = await User.find({ _id: { $in: userIds } }).lean() as UserDocument[]
  const usersMap = Object.fromEntries(usersArr.map((u: UserDocument) => [u._id.toString(), u]))
  // Serialize and associate correct user
  const serializedOrders = orders.map((order: OrderDocument) => {
    const userId = order.userId?.toString?.() ?? order.user_id?.toString?.()
    const user = usersMap[userId]
    return serializeOrder(order, user)
  })

  // Calculate metrics
  const totalRevenue = serializedOrders.reduce((sum, order) => sum + (order.total || 0), 0)
  const completedOrders = serializedOrders.filter(order => order.estado === 'completed' || order.estado === 'Completed').length
  const pendingOrders = serializedOrders.filter(order => order.estado === 'pending' || order.estado === 'Pending').length
  const totalOrders = serializedOrders.length
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Calculate recent orders (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentOrders = serializedOrders.filter(order => new Date(order.createdAt) >= thirtyDaysAgo)
  const recentRevenue = recentOrders.reduce((sum, order) => sum + (order.total || 0), 0)

  return (
    <div className="p-6">
      {/* Simple Header */}
      <div className="flex justify-between items-center bg-gray-800 text-white px-5 py-3 rounded-lg shadow-md">
        <h1 className="text-xl font-semibold text-white">Orders Management</h1>
        <div className="flex gap-6 items-center">
          <div className="px-4 py-2 rounded-lg hover:bg-gray-700">
            <span className="text-sm">Revenue: ${totalRevenue.toFixed(2)}</span>
          </div>
          <div className="px-4 py-2 rounded-lg hover:bg-gray-700">
            <span className="text-sm">{totalOrders} Orders</span>
          </div>
        </div>
      </div>

      <div className="space-y-6 mt-6">

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +${recentRevenue.toFixed(2)} from last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {recentOrders.length} orders in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedOrders}</div>
            <p className="text-xs text-muted-foreground">
              {totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Per order average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order Status Distribution</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="default" className="bg-green-100 text-green-800">
                Completed: {completedOrders}
              </Badge>
              <Badge variant="default" className="bg-orange-100 text-orange-800">
                Pending: {pendingOrders}
              </Badge>
              {totalOrders - completedOrders - pendingOrders > 0 && (
                <Badge variant="default" className="bg-gray-100 text-gray-800">
                  Other: {totalOrders - completedOrders - pendingOrders}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders List</CardTitle>
          <p className="text-sm text-muted-foreground">
            View and manage all customer orders
          </p>
        </CardHeader>
        <CardContent>
          <OrdersTable orders={serializedOrders} />
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

export default Page