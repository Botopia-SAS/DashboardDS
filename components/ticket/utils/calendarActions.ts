/**
 * Calendar action handlers (save, delete, update)
 */

interface TicketFormData {
  _id?: string;
  date: string;
  hour: string;
  endHour: string;
  type: string;
  status: string;
  students: string[];
  spots: number;
  classId?: string;
  duration?: string;
  locationId?: string;
  studentRequests?: string[];
  recurrence?: string;
  recurrenceEndDate?: string;
}

export const deleteTicketClass = async (id: string): Promise<void> => {
  const res = await fetch(`/api/ticket/classes/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to delete class');
  }
};

export const saveTicketClass = async (data: TicketFormData): Promise<void> => {
  if (data.recurrence && data.recurrence !== 'none' && data.recurrenceEndDate) {
    await createRecurringClasses(data);
  } else {
    await createSingleClass(data);
  }
};

const createRecurringClasses = async (data: TicketFormData): Promise<void> => {
  const startDate = new Date(data.date);
  const endDate = new Date(data.recurrenceEndDate!);
  const step = data.recurrence === 'daily' ? 1 : data.recurrence === 'weekly' ? 7 : 30;
  const payload: any[] = [];

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + step)) {
    payload.push({
      date: d.toISOString().split('T')[0],
      hour: data.hour,
      endHour: data.endHour,
      classId: data.classId,
      type: data.type,
      locationId: data.locationId,
      students: data.students,
      spots: data.spots,
      duration: data.duration,
      studentRequests: data.studentRequests || [],
    });
  }

  const response = await fetch('/api/ticket/classes/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || 'Failed to create recurring classes');
  }
};

const createSingleClass = async (data: TicketFormData): Promise<void> => {
  const response = await fetch('/api/ticket/classes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date: data.date,
      hour: data.hour,
      endHour: data.endHour,
      classId: data.classId,
      type: data.type,
      locationId: data.locationId,
      students: data.students,
      spots: data.spots,
      duration: data.duration,
      studentRequests: data.studentRequests || [],
    }),
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || 'Failed to create class');
  }
};
