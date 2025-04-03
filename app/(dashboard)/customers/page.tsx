"use client";
import { DataTable } from "@/components/custom ui/DataTable";
import { customersColumns } from "@/components/customers/CustomersColumns";
import { Button } from "@/components/ui/button";
import { Separator } from "@radix-ui/react-separator";
import { Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/custom ui/Loader";

const CustomersDashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const getCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/customers", { method: "GET" });
      const data = await res.json();
      setCustomers(data);
      setLoading(false);
    } catch (err) {
      console.error("[customers_GET]", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([getCustomers()]);
    };
    fetchData();
  }, []);

  if (loading) return <Loader />

  return (
    <div className="p-5">
      <div className="mt-6">
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-gray-800">Customers</p>
            <Button className="bg-blue-500 text-white" onClick={() => router.push("/customers/new")}>
              <Plus className="size-4 mr-2" />
              Create customer
            </Button>
          </div>
          <Separator className="bg-gray-400 my-4" />
          <DataTable columns={customersColumns} data={customers} searchKey="name" />
        </div>
      </div>
    </div>
  );
};

export default CustomersDashboard;
