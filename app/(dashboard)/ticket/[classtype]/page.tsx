"use client";
import useClassTypeStore, { ClassTypeOption } from "@/app/store/classTypeStore";
import Navigation from "@/components/ticket/navigation-card";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TicketCalendar from "@/components/ticket/TicketCalendar";
import { useState, useEffect } from "react";
import Loader from "@/components/custom ui/Loader";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { useSearchParams, useRouter, useParams } from "next/navigation";

export default function TicketClassTypePage() {
  const params = useParams();
  const router = useRouter();
  const classtype = params.classtype as string;

  const { setClassType, setAvailableClassTypes } = useClassTypeStore();
  const [loading, setLoading] = useState(true);
  const [tabChangeLoading, setTabChangeLoading] = useState(false);
  const [loadingClassType, setLoadingClassType] = useState('');
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const [classTypes, setClassTypes] = useState<ClassTypeOption[]>([]);
  const [currentClassType, setCurrentClassType] = useState(classtype?.toLowerCase() || 'date');
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
        const normalizedClasstype = classtype.toLowerCase();
        const isValidType = data.some((ct: ClassTypeOption) => ct.name.toLowerCase() === normalizedClasstype);

        if (isValidType) {
          setClassType(normalizedClasstype);
          setCurrentClassType(normalizedClasstype);
        } else {
          // Si no es válido, usar el primer tipo disponible
          if (data.length > 0) {
            const defaultType = data[0].name.toLowerCase();
            setCurrentClassType(defaultType);
            setClassType(defaultType);
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

        const normalizedClasstype = classtype.toLowerCase();
        const isValidType = fallbackTypes.some(ct => ct.name.toLowerCase() === normalizedClasstype);
        if (isValidType) {
          setClassType(normalizedClasstype);
          setCurrentClassType(normalizedClasstype);
        } else {
          const defaultType = fallbackTypes[0].name.toLowerCase();
          setCurrentClassType(defaultType);
          setClassType(defaultType);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchClassTypes();
  }, []); // Solo ejecutar una vez al montar

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
    const normalizedType = newClassType.toLowerCase();

    console.log('🔄 Tab change:', normalizedType);

    // Prevenir cambio si es el mismo tipo
    if (normalizedType === currentClassType) {
      console.log('⏭️ Same type, skipping');
      return;
    }

    // Set the loading type FIRST
    setLoadingClassType(normalizedType);

    // Start loading
    setTabChangeLoading(true);

    // Update current type
    setCurrentClassType(normalizedType);

    // Update store
    setClassType(normalizedType);

    // Force calendar refresh
    setCalendarRefreshKey(prev => prev + 1);

    // Update URL sin recargar la página
    const newUrl = `/ticket/${normalizedType}${window.location.search}`;
    window.history.pushState({ classType: normalizedType }, '', newUrl);

    // End loading
    setTimeout(() => {
      setTabChangeLoading(false);
    }, 300);
  };

  if (loading) return <Loader />;

  return (
    <>
      {/* Loading overlay for tab changes */}
      {tabChangeLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-lg font-medium text-gray-700">Loading {loadingClassType.toUpperCase()}...</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-6">
        <DashboardHeader title="Tickets" />
      </div>
      <div className="p-6">
        <Tabs className="w-full" value={currentClassType} onValueChange={handleTabChange}>
          <TabsList className={`grid w-full gap-x-2`} style={{ gridTemplateColumns: `repeat(${classTypes.length}, 1fr)` }}>
            {classTypes.map((classType) => (
              <TabsTrigger
                key={classType._id}
                value={classType.name.toLowerCase()}
                className="px-4 py-2 rounded-lg hover:bg-gray-100 w-full data-[state=active]:bg-gray-300 data-[state=active]:font-medium"
              >
                {classType.name.toUpperCase()}
              </TabsTrigger>
            ))}
          </TabsList>
          {classTypes.map((classType) => (
            <TabsContent key={classType._id} value={classType.name.toLowerCase()} className="w-full">
              <Separator className="bg-gray-400 my-4" />
              <Card>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                    <Navigation
                      href={`/ticket/day-of-class/${classType.name.toLowerCase()}`}
                      title="Day of Class Preparation"
                      description="Prepare for upcoming classes"
                    />
                    <Navigation
                      href="/ticket/utilities"
                      title="Utilities / Records"
                      description="Access common utilities and records"
                    />
                    <Navigation
                      href={`/ticket/test-${classType.name.toLowerCase()}`}
                      title={`📄 ${classType.name.toUpperCase()} Certificate`}
                      description={`Generate ${classType.name.toUpperCase()} certificates`}
                    />
                  </div>
                  <div className="mt-8">
                    <TicketCalendar
                      key={`calendar-${currentClassType}-${calendarRefreshKey}`}
                      refreshKey={calendarRefreshKey}
                      classType={currentClassType}
                      focusClassId={classId}
                      focusWeek={week ? parseInt(week) : undefined}
                      focusYear={year ? parseInt(year) : undefined}
                      highlightEventId={eventId}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </>
  );
}