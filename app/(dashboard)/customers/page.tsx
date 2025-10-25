"use client";
import { SimpleDataTable } from "@/components/custom ui/SimpleDataTable";
import { Button } from "@/components/ui/button";
import { Separator } from "@radix-ui/react-separator";
import { Plus, ArrowUpRight } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/custom ui/Loader";
import DashboardHeader from "@/components/layout/DashboardHeader";
import Link from "next/link";
import Delete from "@/components/custom ui/Delete";
import { format } from "date-fns";

interface Customer {
  id: string;
  name: string;
  email: string;
  licenseNumber?: string;
  createdAt?: string;
}

const CustomersDashboard = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const getCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/customers", { method: "GET" });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const text = await res.text();
      if (!text) {
        console.warn("[customers_GET] Empty response");
        setCustomers([]);
        return;
      }

      const data = JSON.parse(text);
      setCustomers(data);
    } catch (err) {
      console.error("[customers_GET]", err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([getCustomers()]);
    };
    fetchData();
  }, []);

  if (loading) return <Loader />;

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (customer: Customer) => (
        <Link
          href={`/customers/${customer.id}`}
          className="flex items-center gap-2 font-semibold text-blue-500 hover:text-blue-700"
        >
          {customer.name}
          <ArrowUpRight size={16} className="opacity-75" />
        </Link>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (customer: Customer) => (
        <span className="font-medium text-gray-700">{customer.email}</span>
      ),
    },
    {
      key: "licenseNumber",
      header: "License Number",
      render: (customer: Customer) => (
        <span className="font-medium text-gray-700">
          {customer.licenseNumber || "Not available"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Registration Date",
      render: (customer: Customer) => {
        const date = customer.createdAt ? new Date(customer.createdAt) : null;
        return (
          <span className="font-medium text-gray-700">
            {date ? format(date, "MMM d, yyyy h:mm a") : "Not available"}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (customer: Customer) => <Delete item="customers" id={customer.id} />,
    },
  ];

  return (
    <div className="p-5">
      <DashboardHeader title="Customers">
        <Button
          className="bg-blue-500 text-white"
          onClick={() => router.push("/customers/new")}
        >
          <Plus className="size-4 mr-2" />
          Create customer
        </Button>
      </DashboardHeader>
      <div className="mt-6">
        <Separator className="bg-gray-400 my-4" />
        <SimpleDataTable
          data={customers}
          columns={columns}
          searchKeys={["name", "email", "licenseNumber"]}
        />
      </div>
    </div>
  );
};

export default CustomersDashboard;
