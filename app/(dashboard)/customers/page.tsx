"use client";
import { DataTable } from "@/components/custom ui/DataTable";
import { customersColumns } from "@/components/customers/CustomersColumns";
import { Button } from "@/components/ui/button";
import { Separator } from "@radix-ui/react-separator";
import { Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const CustomersDashboard = () => {
  const [customers, setCustomers] = useState([]);
  const router = useRouter();

  const getCustomers = async () => {
    try {
      const res = await fetch("/api/customers", { method: "GET" });
      const data = await res.json();
      console.log(data);
      setCustomers(data);
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
