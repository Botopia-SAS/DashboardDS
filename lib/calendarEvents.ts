// Utility functions to trigger calendar refresh events

export const triggerCalendarRefresh = () => {
  console.log('🔄 Triggering calendar refresh event');

  // Disparar evento personalizado
  window.dispatchEvent(new CustomEvent('calendarRefresh'));

  // Backup con localStorage para ventanas múltiples
  localStorage.setItem('calendarNeedsRefresh', Date.now().toString());
};

export const triggerStudentRequestUpdate = () => {
  console.log('🔄 Triggering student request update event');

  // Disparar evento personalizado
  window.dispatchEvent(new CustomEvent('studentRequestUpdate'));

  // Backup con localStorage para ventanas múltiples
  localStorage.setItem('studentRequestUpdate', Date.now().toString());
};

export const triggerTicketClassUpdate = () => {
  console.log('🔄 Triggering ticket class update event');

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
  console.log('🧪 Testing calendar events...');
  refreshTicketCalendar();
  triggerStudentRequestUpdate();
  console.log('✅ All calendar events triggered successfully');
};