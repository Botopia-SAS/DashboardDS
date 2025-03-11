"use client";

import Loader from "@/components/custom ui/Loader";
import CustomersForm from "@/components/customers/CustomersForm";
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
  };
  emailAddresses: CustomerEmailAddressesType[];
};
type CustomerType = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  ssnLast4: string;
  hasLicense: boolean;
  licenseNumber?: string;
};
type CustomerEmailAddressesType = {
  emailAddress: string;
};

const CustomerDetails = () => {
  const [loading, setLoading] = useState(true);
  const [customerFetch, setCustomerFetch] = useState<CustomerFetchType | null>(
    null
  );
  const [customer, setCustomer] = useState<CustomerType | null>(null);
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
        setCustomerFetch(data);
        setCustomer({
          id: data.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.emailAddresses[0].emailAddress,
          ssnLast4: data.publicMetadata.ssnLast4,
          hasLicense: data.publicMetadata.hasLicense,
          licenseNumber: data.publicMetadata.licenseNumber,
        });
      } catch (err) {
        console.error("[customerId_GET] Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerDetails();
  }, [params]);

  if (loading) return <Loader />;
  if (!customerFetch) return <div>Customer not found</div>;
  return <CustomersForm initialData={customer} />;
};

export default CustomerDetails;
