import { InstructorData } from "../types";

type UseTicketClassCacheParams = {
  initialData: InstructorData | undefined;
  enrichedTicketData: Record<string, any>;
  setEnrichedTicketData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  allInstructorTicketClasses: any[];
  setAllInstructorTicketClasses: React.Dispatch<React.SetStateAction<any[]>>;
  instructorTicketClassesLoaded: boolean;
  setInstructorTicketClassesLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  loadedTicketClassIds: Set<string>;
  setLoadedTicketClassIds: React.Dispatch<React.SetStateAction<Set<string>>>;
};

export function useTicketClassCache({
  initialData,
  enrichedTicketData,
  setEnrichedTicketData,
  allInstructorTicketClasses,
  setAllInstructorTicketClasses,
  instructorTicketClassesLoaded,
  setInstructorTicketClassesLoaded,
  loadedTicketClassIds,
  setLoadedTicketClassIds
}: UseTicketClassCacheParams) {
  // Cargar TODAS las ticket classes del instructor de una sola vez
  const loadInstructorTicketClasses = async () => {
    if (!initialData?._id) {
      return;
    }
    
    // Solo cargar si aún no se han cargado o se fuerza la recarga
    if (instructorTicketClassesLoaded) {
      // console.log(`[CACHE] Using previously cached ticket classes for instructor: ${initialData._id}`);
      return;
    }

    // console.log(`[CACHE] Loading all ticket classes for instructor: ${initialData._id}`);

    try {
      const res = await fetch(`/api/ticket/classes?instructorId=${initialData._id}`);
      if (res.ok) {
        const ticketClasses = await res.json();
        // console.log(`[CACHE] Loaded ${ticketClasses.length} ticket classes for instructor`);
        
        setAllInstructorTicketClasses(ticketClasses);
        
        // Crear el cache de datos enriquecidos con todas las ticket classes
        const enrichedData: Record<string, any> = { ...enrichedTicketData };
        const newlyLoadedIds = new Set<string>();
        
        ticketClasses.forEach((ticket: any) => {
          const ticketId = ticket._id;
          newlyLoadedIds.add(ticketId);
          
          enrichedData[ticketId] = {
            students: ticket.students || [],
            cupos: ticket.cupos || 30,
            classId: ticket.classId,
            locationId: ticket.locationId,
            amount: ticket.price,
            duration: ticket.duration ? parseInt(String(ticket.duration).replace('h', '')) : 4,
            type: ticket.type,
            date: ticket.date,
            hour: ticket.hour,
            endHour: ticket.endHour,
            // Guardar una copia completa del objeto para tener acceso a todos sus datos
            fullData: ticket
          };
        });
        
        // Actualizar el cache y el conjunto de IDs cargados
        setEnrichedTicketData(enrichedData);
        setLoadedTicketClassIds((prev: Set<string>) => new Set([...prev, ...newlyLoadedIds]));
        setInstructorTicketClassesLoaded(true);
        
        // console.log(`[CACHE] Enriched data created for ${Object.keys(enrichedData).length} ticket classes`);
      }
    } catch (error) {
      console.error('Error loading instructor ticket classes:', error);
    }
  };

  // Función para enriquecer eventos del calendario con datos de ticket classes
  const enrichCalendarEvents = async (schedule: any[]) => {
    try {
      // Si ya cargamos todas las ticket classes del instructor, no necesitamos hacer nada más
      if (instructorTicketClassesLoaded && allInstructorTicketClasses.length > 0) {
        console.log('[CACHE] Using pre-loaded instructor ticket classes for enrichment');
        return;
      }
      
      // En caso contrario, usar el enfoque original de cargar las clases individualmente
      const ticketClassIds = schedule
        .filter(slot => slot.ticketClassId)
        .map(slot => slot.ticketClassId!)
        .filter((id, index, arr) => arr.indexOf(id) === index); // unique IDs

      if (ticketClassIds.length === 0) return;

      // Solo cargar los que no hemos cargado ya
      const idsToLoad = ticketClassIds.filter(id => !loadedTicketClassIds.has(id));
      
      if (idsToLoad.length === 0) {
        console.log('[CACHE] All ticket class data already loaded, skipping API calls');
        return;
      }

      console.log(`[CACHE] Loading ${idsToLoad.length} new ticket classes out of ${ticketClassIds.length} total`);

      const enrichedData: Record<string, any> = { ...enrichedTicketData };
      const newlyLoaded = new Set<string>();

      // Cargar solo los datos que no tenemos aún
      for (const ticketClassId of idsToLoad) {
        try {
          const res = await fetch(`/api/ticket/classes/${ticketClassId}`);
          if (res.ok) {
            const ticketData = await res.json();
            enrichedData[ticketClassId] = {
              students: ticketData.students || [],
              cupos: ticketData.cupos || 30,
              classId: ticketData.classId,
              locationId: ticketData.locationId,
              amount: ticketData.price,
              duration: ticketData.duration,
              type: ticketData.type,
              date: ticketData.date,
              hour: ticketData.hour,
              endHour: ticketData.endHour,
            };
            newlyLoaded.add(ticketClassId);
            console.log(`[CACHE] Loaded ticket class data for ${ticketClassId}:`, enrichedData[ticketClassId]);
          } else {
            console.warn(`[CACHE] Failed to load ticket class ${ticketClassId}: ${res.status}`);
          }
        } catch (error) {
          console.error(`[CACHE] Error loading ticket class ${ticketClassId}:`, error);
          // Continue with other ticket classes even if one fails
        }
      }

      if (newlyLoaded.size > 0) {
        setEnrichedTicketData(enrichedData);
        setLoadedTicketClassIds((prev: Set<string>) => new Set([...prev, ...newlyLoaded]));
        console.log(`[CACHE] Successfully loaded ${newlyLoaded.size} new ticket classes`);
      }
    } catch (error) {
      console.error('[CACHE] Error in enrichCalendarEvents:', error);
      // Don't throw - this is not critical for the app to function
    }
  };

  return {
    loadInstructorTicketClasses,
    enrichCalendarEvents,
  };
} 