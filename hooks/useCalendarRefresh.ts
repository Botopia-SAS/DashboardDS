import { useCallback } from 'react';

/**
 * Hook personalizado para manejar la actualización del calendario
 * Proporciona funciones para disparar actualizaciones del calendario
 * desde cualquier componente de la aplicación
 */
export const useCalendarRefresh = () => {
  const refreshCalendar = useCallback(() => {
    // Disparar evento personalizado
    window.dispatchEvent(new CustomEvent('calendarRefresh'));
    
    // También usar localStorage como backup
    localStorage.setItem('calendarNeedsRefresh', 'true');
    
    console.log('🔄 Calendar refresh triggered via useCalendarRefresh hook');
  }, []);

  const refreshCalendarWithDelay = useCallback((delay: number = 1000) => {
    setTimeout(() => {
      refreshCalendar();
    }, delay);
  }, [refreshCalendar]);

  return {
    refreshCalendar,
    refreshCalendarWithDelay
  };
};
