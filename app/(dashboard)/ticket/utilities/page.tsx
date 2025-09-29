"use client";

import useClassTypeStore from "@/app/store/classTypeStore";
import Navigation from "@/components/ticket/navigation-card";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { ArrowLeft, Wrench } from "lucide-react";
import Link from "next/link";

export default function UtilitiesPage() {
  const { classType } = useClassTypeStore();

  // Define which class types should show certificates
  const certificateTypes = ["date", "bdi", "adi"];
  const shouldShowCertificate = certificateTypes.includes(classType.toLowerCase());

  return (
    <>
      <div className="p-6">
        <DashboardHeader title="Utilities / Records" />
      </div>
      
      <div className="p-6">
        {/* Navigation Header */}
        <div className="mb-6">
          <Link
            href="/ticket"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tickets
          </Link>
        </div>

        <Separator className="bg-gray-400 my-4" />
        
        <Card>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
              {/* Show certificate option only for specific class types */}
              {shouldShowCertificate && (
                <Navigation
                  href={`/ticket/test-${classType.toLowerCase()}`}
                  title={`${classType.toUpperCase()} Certificate`}
                  description={`Generate ${classType.toUpperCase()} certificates`}
                />
              )}
              
              {/* Other utility options can be added here */}
              <Navigation
                href="/ticket/utilities/other-records"
                title="Other Records"
                description="Access other utilities and records"
              />
              
              {/* If no certificate type, show a placeholder message */}
              {!shouldShowCertificate && (
                <Card className="col-span-2 bg-gray-50">
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Wrench className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">
                        No certificates available
                      </h3>
                      <p className="text-gray-500">
                        Certificates are only available for DATE, BDI, and ADI class types.
                        <br />
                        Current type: <span className="font-medium">{classType.toUpperCase()}</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
