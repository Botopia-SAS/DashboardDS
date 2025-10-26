// Utility functions to trigger calendar refresh events

export const triggerCalendarRefresh = () => {

  // Disparar evento personalizado
  window.dispatchEvent(new CustomEvent('calendarRefresh'));

  // Backup con localStorage para ventanas múltiples
  localStorage.setItem('calendarNeedsRefresh', Date.now().toString());
};

export const triggerStudentRequestUpdate = () => {

  // Disparar evento personalizado
  window.dispatchEvent(new CustomEvent('studentRequestUpdate'));

  // Backup con localStorage para ventanas múltiples
  localStorage.setItem('studentRequestUpdate', Date.now().toString());
};

export const triggerTicketClassUpdate = () => {

  // Disparar evento personalizado
  window.dispatchEvent(new CustomEvent('ticketClassUpdate'));

  // Backup con localStorage para ventanas múltiples
  localStorage.setItem('ticketUpdate', Date.now().toString());
};

// Función general para cualquier actualización del calendario
export const refreshTicketCalendar = () => {
  triggerCalendarRefresh();
  triggerTicketClassUpdate();
};

// Función de testing para verificar que los eventos funcionan
export const testCalendarEvents = () => {

  refreshTicketCalendar();
  triggerStudentRequestUpdate();

};