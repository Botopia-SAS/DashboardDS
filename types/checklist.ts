export interface ChecklistItem {
  name: string;
  completed: boolean;
  rating?: number;
  comments?: string;
  tally?: number;
}

export interface ChecklistNote {
  text: string;
  date: string | Date;
}

export interface SessionChecklist {
  _id?: string;
  checklistType: string;
  sessionId: string;
  studentId: string;
  instructorId: string;
  instructorName?: string;
  instructorEmail?: string;
  items: ChecklistItem[];
  notes: ChecklistNote[];
  status: "pending" | "in_progress" | "completed";
  createdAt?: string | Date;
  updatedAt?: string | Date;
  progress?: number;
  averageRating?: string;
}

export interface SessionChecklistWithProgress extends SessionChecklist {
  progress: number;
  averageRating: string;
}
