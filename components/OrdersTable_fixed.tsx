'use client'
import React, { useState } from 'react'
import useSWR from 'swr'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from './ui/table'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Eye, Package, Calendar, DollarSign } from 'lucide-react'
import { Order } from '@/types/order'

function filterOrders(orders: Order[], query: string, status: string) {
  if (!query && !status) return orders
  return orders.filter(order => {
    const name = `${order.user?.firstName ?? ''} ${order.user?.lastName ?? ''}`.toLowerCase()
    const email = order.user?.email?.toLowerCase() ?? ''
    const orderNumber = String(order.orderNumber ?? '').toLowerCase()
    const date = new Date(order.createdAt).toLocaleString().toLowerCase()
    const statusMatch = status ? (order.estado || order.status) === status : true
    return (
      statusMatch && (
        name.includes(query.toLowerCase()) ||
        email.includes(query.toLowerCase()) ||
        orderNumber.includes(query.toLowerCase()) ||
        date.includes(query.toLowerCase())
      )
    )
  })
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

function getStatusBadge(status: string) {
  const normalizedStatus = status?.toLowerCase()
  switch (normalizedStatus) {
    case 'completed':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>
    case 'pending':
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">Pending</Badge>
    case 'cancelled':
    case 'canceled':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Cancelled</Badge>
    case 'processing':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Processing</Badge>
    default:
      return <Badge variant="secondary">{status || 'Unknown'}</Badge>
  }
}

export default function OrdersTable({ orders: initialOrders }: { orders: Order[] }) {
  const { data: orders = initialOrders } = useSWR('/api/orders', fetcher, { refreshInterval: 5000, fallbackData: initialOrders })
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  
  const filtered = filterOrders(orders, query, status)
  const uniqueStatuses = Array.from(new Set(orders.map((o: Order) => o.estado || o.status)))

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId)
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Section */}
      <div className="flex flex-col md:flex-row gap-2 mb-4 items-center">
        <input
          type="text"
          placeholder="Search by customer name, email, order number, or date..."
          className="border rounded px-3 py-2 w-full md:w-72"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2 w-full md:w-48"
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="">All Status</option>
          {uniqueStatuses.map(s => (
            <option key={String(s)} value={String(s)}>{String(s)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order Details</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Package className="h-8 w-8" />
                  <p>No orders found</p>
                  <p className="text-sm">Try adjusting your search or filter criteria</p>
                </div>
              </TableCell>
            </TableRow>
          )}
          {filtered.map((order: Order) => (
            <React.Fragment key={order._id}>
              <TableRow className="hover:bg-muted/50 transition-colors">
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="font-medium">#{order.orderNumber || order._id.slice(-6)}</div>
                    <div className="text-sm text-muted-foreground">
                      ID: {order._id.slice(-8)}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {order.user?.firstName} {order.user?.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.user?.email}
                    </div>
                    {order.user?.phoneNumber ? (
                      <div className="text-sm text-muted-foreground">
                        {order.user.phoneNumber}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">
                        No phone number
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  {getStatusBadge(order.estado || order.status || 'unknown')}
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-bold text-green-600">
                      {order.total?.toFixed(2) ?? '0.00'}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">
                      {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </TableCell>
                
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleOrderDetails(order._id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {expandedOrder === order._id ? 'Hide' : 'View'}
                  </Button>
                </TableCell>
              </TableRow>
              
              {/* Expanded Details Row */}
              {expandedOrder === order._id && (
                <TableRow>
                  <TableCell colSpan={7} className="bg-muted/20">
                    <div className="p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Order Items
                      </h4>
                      <div className="grid gap-3">
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item, idx: number) => (
                            <div key={order._id + '-item-' + idx} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                              <div className="flex-1">
                                <div className="font-medium">{item.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  Quantity: {item.quantity}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold flex items-center gap-1">
                                  <DollarSign className="h-3 w-3 text-green-600" />
                                  {(item.price * item.quantity).toFixed(2)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {item.price?.toFixed(2)} each
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            No items found for this order
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}