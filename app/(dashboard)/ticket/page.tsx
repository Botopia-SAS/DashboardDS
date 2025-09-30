"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/custom ui/Loader";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { useSearchParams } from "next/navigation";
import { GovCertificateDialog } from "@/components/ticket/gov-certificate-dialog";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useClassTypeStore } from "@/stores/classTypeStore"; // Asegúrate de importar el store

export default function Pages() {
  const router = useRouter();
  const { setClassType } = useClassTypeStore();
  const [loading, setLoading] = useState(true);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const [isGovCertDialogOpen, setIsGovCertDialogOpen] = useState(false);
  const searchParams = useSearchParams();

  // Obtener parámetros de la URL
  const classId = searchParams.get('classId');
  const week = searchParams.get('week');
  const year = searchParams.get('year');
  const eventId = searchParams.get('eventId');

  useEffect(() => {
    // Si no hay classId, redirigir a la página por defecto
    if (!classId) {
      router.replace("/ticket/date");
    } else {
      setLoading(false); // Detener la carga una vez que se tiene el classId
    }
  }, [router, classId]);

  // Función para refrescar el calendario
  const refreshCalendar = () => {
    setCalendarRefreshKey(prev => prev + 1);
  };

  // Escuchar eventos de actualización desde otras partes de la app
  useEffect(() => {
    const handleCalendarRefresh = () => {
      refreshCalendar();
    };

    window.addEventListener('calendarRefresh', handleCalendarRefresh);

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
        <DashboardHeader title="Tickets">
          <Button
            onClick={() => setIsGovCertDialogOpen(true)}
            className="flex items-center gap-2"
            variant="outline"
          >
            <FileText className="h-4 w-4" />
            Government Certificate
          </Button>
        </DashboardHeader>
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

          {/* Define TabsContent for each class type */}
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

      <GovCertificateDialog
        open={isGovCertDialogOpen}
        onOpenChange={setIsGovCertDialogOpen}
      />
    </>
  );
}
