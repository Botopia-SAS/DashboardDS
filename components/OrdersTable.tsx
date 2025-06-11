'use client'
import React, { useState } from 'react'
import useSWR from 'swr'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from './ui/table'

function filterOrders(orders: any[], query: string, status: string) {
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

export default function OrdersTable({ orders: initialOrders }: { orders: any[] }) {
  const { data: orders = initialOrders } = useSWR('/api/orders', fetcher, { refreshInterval: 5000, fallbackData: initialOrders })
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const filtered = filterOrders(orders, query, status)
  const uniqueStatuses = Array.from(new Set(orders.map((o: any) => o.estado || o.status)))

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-2 mb-4 items-center">
        <input
          type="text"
          placeholder="Search by name, email, order #, or date..."
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Products</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center">No orders found.</TableCell>
            </TableRow>
          )}
          {filtered.map((order: any) => (
            <TableRow key={order._id}>
              <TableCell className="font-bold">{order.orderNumber || '-'}</TableCell>
              <TableCell className="font-semibold">{order.user?.firstName} {order.user?.lastName}</TableCell>
              <TableCell>{order.user?.email}</TableCell>
              <TableCell>{order.estado || order.status}</TableCell>
              <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
              <TableCell className="font-bold">${order.total?.toFixed(2) ?? '-'}</TableCell>
              <TableCell className="p-0">
                <div className="flex flex-col gap-1">
                  {order.items?.map((item: any, idx: number) => (
                    <div key={order._id + '-item-' + idx} className="flex justify-between border-b last:border-b-0 pb-1">
                      <span>{item.title}</span>
                      <span className="text-right min-w-[80px]">${item.price?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 