"use client";
import useClassTypeStore, { ClassTypeOption } from "@/app/store/classTypeStore";
import Navigation from "@/components/ticket/navigation-card";
// import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TicketCalendar from "@/components/ticket/TicketCalendar";
import { useState, useEffect } from "react";
import Loader from "@/components/custom ui/Loader";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { useSearchParams, useParams } from "next/navigation";
import { GovCertificateDialog } from "@/components/ticket/gov-certificate-dialog";
import { AdiCertificateDialog } from "@/components/ticket/adi-certificate-dialog";
import { Button } from "@/components/ui/button";
import { FileText, GraduationCap } from "lucide-react";

export default function TicketClassTypePage() {
  const params = useParams();
  // const router = useRouter();
  const classtype = params.classtype as string;

  // Función helper para normalizar nombres de clase (espacios a guiones)
  const normalizeClassType = (name: string) => name.toLowerCase().trim().replace(/\s+/g, '-');

  const { setClassType, setAvailableClassTypes } = useClassTypeStore();
  const [loading, setLoading] = useState(true);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const [classTypes, setClassTypes] = useState<ClassTypeOption[]>([]);
  const [currentClassType, setCurrentClassType] = useState(classtype?.toLowerCase() || 'date');
  const [isGovCertDialogOpen, setIsGovCertDialogOpen] = useState(false);
  const [isAdiCertDialogOpen, setIsAdiCertDialogOpen] = useState(false);
  const searchParams = useSearchParams();

  // Get URL parameters
  const classId = searchParams.get('classId');
  const week = searchParams.get('week');
  const year = searchParams.get('year');
  const eventId = searchParams.get('eventId');

  // Cargar tipos de clase solo una vez al montar
  useEffect(() => {
    const fetchClassTypes = async () => {
      try {
        const res = await fetch('/api/classtypes');
        if (!res.ok) throw new Error('Failed to fetch class types');

        const data = await res.json();
        setClassTypes(data);
        setAvailableClassTypes(data);

        // Verificar si el classtype en la URL es válido
        const normalizedClasstype = normalizeClassType(classtype);
        const isValidType = data.some((ct: ClassTypeOption) => normalizeClassType(ct.name) === normalizedClasstype);

        if (isValidType) {
          // Encontrar el tipo original (sin normalizar) para usar como classType
          const originalType = data.find((ct: ClassTypeOption) => normalizeClassType(ct.name) === normalizedClasstype);
          const typeToUse = originalType ? originalType.name.toLowerCase() : normalizedClasstype;
          setClassType(typeToUse);
          setCurrentClassType(normalizedClasstype);
        } else {
          // Si no es válido, usar el primer tipo disponible
          if (data.length > 0) {
            const defaultType = normalizeClassType(data[0].name);
            setCurrentClassType(defaultType);
            setClassType(data[0].name.toLowerCase());
          }
        }
      } catch (error) {
        console.error('Error fetching class types:', error);
        // Fallback to default types
        const fallbackTypes = [
          { _id: '1', name: 'date', createdAt: '', updatedAt: '' },
          { _id: '2', name: 'bdi', createdAt: '', updatedAt: '' },
          { _id: '3', name: 'adi', createdAt: '', updatedAt: '' }
        ];
        setClassTypes(fallbackTypes);
        setAvailableClassTypes(fallbackTypes);

        const normalizedClasstype = normalizeClassType(classtype);
        const isValidType = fallbackTypes.some(ct => normalizeClassType(ct.name) === normalizedClasstype);
        if (isValidType) {
          const originalType = fallbackTypes.find(ct => normalizeClassType(ct.name) === normalizedClasstype);
          const typeToUse = originalType ? originalType.name.toLowerCase() : normalizedClasstype;
          setClassType(typeToUse);
          setCurrentClassType(normalizedClasstype);
        } else {
          const defaultType = normalizeClassType(fallbackTypes[0].name);
          setCurrentClassType(defaultType);
          setClassType(fallbackTypes[0].name.toLowerCase());
        }
      } finally {
        setLoading(false);
      }
    };

    fetchClassTypes();
  }, []); // Solo ejecutar una vez al montar

  // Escuchar cambios en los parámetros de la URL para actualizar el classType
  useEffect(() => {
    if (classTypes.length > 0) {
      const normalizedClasstype = normalizeClassType(classtype);
      const isValidType = classTypes.some((ct: ClassTypeOption) => normalizeClassType(ct.name) === normalizedClasstype);

      if (isValidType) {
        // Encontrar el tipo original (sin normalizar) para usar como classType
        const originalType = classTypes.find((ct: ClassTypeOption) => normalizeClassType(ct.name) === normalizedClasstype);
        const typeToUse = originalType ? originalType.name.toLowerCase() : normalizedClasstype;
        setClassType(typeToUse);
        setCurrentClassType(normalizedClasstype);
      } else {
        // Si no es válido, usar el primer tipo disponible
        if (classTypes.length > 0) {
          const defaultType = normalizeClassType(classTypes[0].name);
          setCurrentClassType(defaultType);
          setClassType(classTypes[0].name.toLowerCase());
        }
      }
    }
  }, [classtype, classTypes, setClassType]); // Escuchar cambios en classtype

  // Actualizar inmediatamente cuando cambie la URL (sin esperar classTypes)
  useEffect(() => {
    const normalizedClasstype = normalizeClassType(classtype);
    setCurrentClassType(normalizedClasstype);
  }, [classtype]); // Solo escuchar cambios en classtype

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

  // Handle tab change - NO RELOAD, solo actualizar estado
  const handleTabChange = (newClassType: string) => {
    const normalizedType = normalizeClassType(newClassType);

    // Prevenir cambio si es el mismo tipo
    if (normalizedType === currentClassType) {
      return;
    }

    // Update current type
    setCurrentClassType(normalizedType);

    // Update store
    setClassType(normalizedType);

    // Force calendar refresh
    setCalendarRefreshKey(prev => prev + 1);

    // Update URL sin recargar la página
    const newUrl = `/ticket/${normalizedType}${window.location.search}`;
    window.history.pushState({ classType: normalizedType }, '', newUrl);
  };

  if (loading) return <Loader />;

  return (
    <>
      
      {/* Header con mejor responsive */}
      <div className="px-3 sm:px-6 py-4">
        <DashboardHeader title="Tickets">
          <div className="flex gap-2">
            <Button
              onClick={() => setIsGovCertDialogOpen(true)}
              className="flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4"
              variant="outline"
            >
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Government Certificate</span>
              <span className="sm:hidden">Gov Cert</span>
            </Button>
            <Button
              onClick={() => setIsAdiCertDialogOpen(true)}
              className="flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4"
              variant="outline"
            >
              <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Enrollment Letter</span>
              <span className="sm:hidden">Enrollment</span>
            </Button>
          </div>
        </DashboardHeader>
      </div>

      {/* Tabs con scroll horizontal */}
      <div className="px-3 sm:px-6 pb-6">
        <Tabs className="w-full" value={currentClassType} onValueChange={handleTabChange}>
          {/* Contenedor con scroll horizontal para las tabs */}
          <div className="relative w-full overflow-x-auto scrollbar-hide -mx-3 sm:mx-0 px-3 sm:px-0">
            <TabsList className="inline-flex sm:flex sm:w-full gap-1 sm:gap-2 pb-2 sm:pb-0 min-w-min">
              {classTypes.map((classType) => (
                <TabsTrigger
                  key={classType._id}
                  value={normalizeClassType(classType.name)}
                  className="
                    px-3 sm:px-4 py-2
                    rounded-lg hover:bg-gray-100
                    whitespace-nowrap
                    text-xs sm:text-sm
                    flex-shrink-0
                    data-[state=active]:bg-gray-300 data-[state=active]:font-medium
                  "
                >
                  {classType.name.toUpperCase()}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {classTypes.map((classType) => (
            <TabsContent key={classType._id} value={normalizeClassType(classType.name)} className="w-full mt-4">
              <Separator className="bg-gray-400 mb-4" />

              {/* Navigation Card - Responsive */}
              <div className="mb-4">
                <Navigation
                  href={`/ticket/day-of-class/${normalizeClassType(classType.name)}`}
                  title="Day of Class Preparation"
                  description="Prepare for upcoming classes"
                />
              </div>

              {/* Calendar - Responsive */}
              <TicketCalendar
                key={`calendar-${currentClassType}-${calendarRefreshKey}`}
                refreshKey={calendarRefreshKey}
                classType={currentClassType}
                focusClassId={classId}
                focusWeek={week ? parseInt(week) : undefined}
                focusYear={year ? parseInt(year) : undefined}
                highlightEventId={eventId}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <GovCertificateDialog
        open={isGovCertDialogOpen}
        onOpenChange={setIsGovCertDialogOpen}
      />

      <AdiCertificateDialog
        open={isAdiCertDialogOpen}
        onOpenChange={setIsAdiCertDialogOpen}
      />
    </>
  );
}