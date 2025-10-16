"use client";

import Loader from "@/components/custom ui/Loader";
import CustomersForm from "@/components/customers/CustomersForm";
import CustomerTabs, { TabType } from "@/components/customers/CustomerTabs";
import ClassHistory from "@/components/customers/ClassHistory";
import CertificateHistory from "@/components/customers/CertificateHistory";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export type CustomerFetchType = {
  id: string;
  firstName: string;
  lastName: string;
  publicMetadata: {
    role: string;
    ssnLast4: string;
    hasLicense: boolean;
    licenseNumber: string;
    birthDate: string;
    middleName: string;
  };
  emailAddresses: CustomerEmailAddressesType[];
};
type CustomerType = {
  _id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email?: string;
  password?: string;
  ssnLast4: string;
  hasLicense: boolean;
  licenseNumber?: string;
  birthDate: string;
  streetAddress: string;
  apartmentNumber: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  sex: string;
  howDidYouHear: string;
  payedAmount: number;
  method: string;
  createdAt?: string; // Añadiendo el campo de fecha de creación
};
type CustomerEmailAddressesType = {
  emailAddress: string;
};

const CustomerDetails = () => {
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<CustomerType | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("update");
  const params = useParams();

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      const customerId = params?.customerId;
      if (!customerId || typeof customerId !== "string") {
        console.error("Invalid customerId:", customerId);
        setLoading(false);
        return;
      }

      try {
        console.log("🔍 Fetching customer details for ID:", customerId);
        const res = await fetch(`/api/customers/${customerId}`);
        if (!res.ok) {
          console.error(
            "❌ Failed to fetch customer details. Status:",
            res.status
          );
          throw new Error(`Failed to fetch: ${res.status}`);
        }

        const data = await res.json();
        console.log("✅ Customer details fetched successfully:", data);
        setCustomer(data);
      } catch (err) {
        console.error("[customerId_GET] Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerDetails();
  }, [params]);

  if (loading) return <Loader />;
  if (!customer) return <div>Customer not found</div>;

  const customerId = params?.customerId as string;

  return (
    <div className="px-2 sm:px-4 lg:px-6 py-8">
      <CustomerTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === "update" && <CustomersForm initialData={customer} />}
        {activeTab === "classes" && <ClassHistory customerId={customerId} />}
        {activeTab === "certificates" && (
          <CertificateHistory customerId={customerId} />
        )}
      </div>
    </div>
  );
};

export default CustomerDetails;
