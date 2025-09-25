"use client";
import useClassTypeStore from "@/app/store/classTypeStore";
import Navigation from "@/components/ticket/navigation-card";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TicketCalendar from "@/components/ticket/TicketCalendar";
import { useState, useEffect } from "react";
import Loader from "@/components/custom ui/Loader";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { useSearchParams } from "next/navigation";

export default function Pages() {
  const { setClassType } = useClassTypeStore();
  const [loading, setLoading] = useState(true);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const searchParams = useSearchParams();
  
  // Get URL parameters
  const classId = searchParams.get('classId');
  const week = searchParams.get('week');
  const year = searchParams.get('year');
  const eventId = searchParams.get('eventId');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Función para refrescar el calendario
  const refreshCalendar = () => {
    setCalendarRefreshKey(prev => prev + 1);
  };

  // Escuchar eventos de actualización desde otras partes de la app
  useEffect(() => {
    const handleCalendarRefresh = () => {
      refreshCalendar();
    };

    // Escuchar eventos personalizados
    window.addEventListener('calendarRefresh', handleCalendarRefresh);
    
    // También escuchar cambios en el localStorage como backup
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'calendarNeedsRefresh') {
        refreshCalendar();
        localStorage.removeItem('calendarNeedsRefresh');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('calendarRefresh', handleCalendarRefresh);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (loading) return <Loader />;

  return (
    <>
      <div className="p-6">
        <DashboardHeader title="Tickets" />
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
                    href="/ticket/test-date"
                    title="📄 Test D.A.T.E. Certificate"
                    description="Test and generate D.A.T.E. certificates"
                  />
                </div>
                <div className="mt-8">
                  <TicketCalendar
                    refreshKey={calendarRefreshKey}
                    focusClassId={classId}
                    focusWeek={week ? parseInt(week) : undefined}
                    focusYear={year ? parseInt(year) : undefined}
                    highlightEventId={eventId}
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
                    href="/ticket/test-bdi"
                    title="🧪 Test BDI Certificate"
                    description="Test and generate BDI certificates"
                  />
                </div>
                <div className="mt-8">
                  <TicketCalendar
                    refreshKey={calendarRefreshKey}
                    focusClassId={classId}
                    focusWeek={week ? parseInt(week) : undefined}
                    focusYear={year ? parseInt(year) : undefined}
                    highlightEventId={eventId}
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
                    href={"/ticket/day-of-class/adi"}
                    title="Day of Class Preparation"
                    description="Prepare for upcoming classes"
                  />
                  <Navigation
                    href="/ticket/utilities"
                    title="Utilities / Records"
                    description="Access common utilities and records"
                  />
                </div>
                <div className="mt-8">
                  <TicketCalendar
                    refreshKey={calendarRefreshKey}
                    focusClassId={classId}
                    focusWeek={week ? parseInt(week) : undefined}
                    focusYear={year ? parseInt(year) : undefined}
                    highlightEventId={eventId}
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
