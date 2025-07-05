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
      // MEJORA: Procesar tanto datos persistentes como temporales
      // Si ya cargamos todas las ticket classes del instructor, actualizar con datos temporales
      if (instructorTicketClassesLoaded && allInstructorTicketClasses.length > 0) {
        console.log('[CACHE] Using pre-loaded instructor ticket classes for enrichment');
        
        // Enriquecer también los ticket classes temporales que pueden haber sido creados
        const tempTicketClasses = schedule.filter(slot => 
          slot.ticketClassId && 
          slot.ticketClassId.startsWith('temp-') &&
          !loadedTicketClassIds.has(slot.ticketClassId)
        );
        
        if (tempTicketClasses.length > 0) {
          console.log('[CACHE] Processing temporary ticket classes:', tempTicketClasses.length);
          
          const enrichedData = { ...enrichedTicketData };
          const newTempIds = new Set<string>();
          
          tempTicketClasses.forEach(slot => {
            if (slot.ticketClassId && !enrichedData[slot.ticketClassId]) {
              enrichedData[slot.ticketClassId] = {
                students: slot.students || [],
                cupos: slot.cupos || 30,
                classId: slot.classId,
                locationId: slot.locationId,
                amount: slot.amount,
                duration: slot.duration,
                type: slot.classType?.toLowerCase(),
                date: slot.date,
                hour: slot.start,
                endHour: slot.end,
                isTemporary: true,
                fullData: null
              };
              newTempIds.add(slot.ticketClassId);
            }
          });
          
          if (newTempIds.size > 0) {
            setEnrichedTicketData(enrichedData);
            setLoadedTicketClassIds(prev => new Set([...prev, ...newTempIds]));
            console.log('[CACHE] Added temporary ticket classes to cache:', newTempIds.size);
          }
        }
        
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

  // Función para limpiar datos temporales del caché después de guardar
  const clearTemporaryTicketClasses = () => {
    const enrichedData = { ...enrichedTicketData };
    const cleanedIds = new Set(loadedTicketClassIds);
    let hasChanges = false;
    
    // Eliminar datos temporales del cache
    Object.keys(enrichedData).forEach(ticketClassId => {
      if (ticketClassId.startsWith('temp-')) {
        delete enrichedData[ticketClassId];
        cleanedIds.delete(ticketClassId);
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      setEnrichedTicketData(enrichedData);
      setLoadedTicketClassIds(cleanedIds);
      console.log('[CACHE] Cleared temporary ticket classes from cache');
    }
  };

  // Función para refrescar el caché completo (útil después de guardar cambios)
  const refreshCache = async () => {
    if (initialData?._id) {
      console.log('[CACHE] Refreshing cache after save');
      
      // Limpiar estado actual
      setEnrichedTicketData({});
      setLoadedTicketClassIds(new Set());
      setAllInstructorTicketClasses([]);
      setInstructorTicketClassesLoaded(false);
      
      // Recargar datos
      await loadInstructorTicketClasses();
    }
  };

  return {
    loadInstructorTicketClasses,
    enrichCalendarEvents,
    clearTemporaryTicketClasses,
    refreshCache,
  };
} 