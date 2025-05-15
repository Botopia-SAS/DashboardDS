"use client";
import useClassTypeStore from "@/app/store/classTypeStore";
import Navigation from "@/components/ticket/navigation-card";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Pages() {
  const { setClassType } = useClassTypeStore();
  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center bg-gray-800 text-white px-5 py-3 rounded-lg shadow-md">
          <h1 className="text-xl font-semibold">Tickets</h1>
        </div>
      </div>
      <div className="p-6">
        <Tabs className="w-full" defaultValue="date">
          <TabsList className="grid w-full grid-cols-3 gap-x-2">
            <TabsTrigger
              value="date"
              onClick={() => setClassType("date")}
              className="px-4 py-2 rounded-lg hover:bg-gray-100 w-full data-[state=active]:bg-gray-300 data-[state=active]:font-medium"
            >
              D.A.T.E.
            </TabsTrigger>
            <TabsTrigger
              value="bdi"
              onClick={() => setClassType("bdi")}
              className="px-4 py-2 rounded-lg hover:bg-gray-100 w-full data-[state=active]:bg-gray-300 data-[state=active]:font-medium"
            >
              B.D.I.
            </TabsTrigger>
            <TabsTrigger
              value="adi"
              onClick={() => setClassType("adi")}
              className="px-4 py-2 rounded-lg hover:bg-gray-100 w-full data-[state=active]:bg-gray-300 data-[state=active]:font-medium"
            >
              A.D.I.
            </TabsTrigger>
          </TabsList>
          <TabsContent value="date" className="w-full">
            <Separator className="bg-gray-400 my-4" />
            <Card>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                  <Navigation
                    href="/ticket/student-record/new"
                    title="New Student Record"
                    description="Create a record for a new student"
                  />
                  <Navigation
                    href="/ticket/student-record"
                    title="Existing Student Record"
                    description="View or edit student records"
                  />
                  <Navigation
                    href={"/ticket/day-of-class/date"}
                    title="Day of Class Preparation"
                    description="Prepare for upcoming classes"
                  />
                  <Navigation
                    href="/ticket/utilities"
                    title="Utilities / Records"
                    description="Access common utilities and records"
                  />
                  <Navigation
                    href="/ticket/monthly-report"
                    title="Monthly Report"
                    description="Generate and view monthly reports"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="bdi" className="w-full">
            <Separator className="bg-gray-400 my-4" />
            <Card>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                  <Navigation
                    href="/ticket/student-record/new"
                    title="New Student Record"
                    description="Create a record for a new student"
                  />
                  <Navigation
                    href="/ticket/student-record"
                    title="Existing Student Record"
                    description="View or edit student records"
                  />
                  <Navigation
                    href={"/ticket/day-of-class/bdi"}
                    title="Day of Class Preparation"
                    description="Prepare for upcoming classes"
                  />
                  <Navigation
                    href="/ticket/utilities"
                    title="Utilities / Records"
                    description="Access common utilities and records"
                  />
                  <Navigation
                    href="/ticket/monthly-report"
                    title="Monthly Report"
                    description="Generate and view monthly reports"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="adi" className="w-full">
            <Separator className="bg-gray-400 my-4" />
            <Card>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                  <Navigation
                    href="/ticket/student-record/new"
                    title="New Student Record"
                    description="Create a record for a new student"
                  />
                  <Navigation
                    href="/ticket/student-record"
                    title="Existing Student Record"
                    description="View or edit student records"
                  />
                  <Navigation
                    href={"/ticket/day-of-class/adi"}
                    title="Day of Class Preparation"
                    description="Prepare for upcoming classes"
                  />
                  <Navigation
                    href="/ticket/utilities"
                    title="Utilities / Records"
                    description="Access common utilities and records"
                  />
                  <Navigation
                    href="/ticket/monthly-report"
                    title="Monthly Report"
                    description="Generate and view monthly reports"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
