import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SelectedStudentsStoreState {
  students: string[];
  setStudents: (students: string[]) => void;
  addStudent: (student: string) => void;
  clear: () => void;
}

const useSelectedStudentsStore = create<SelectedStudentsStoreState>()(
  persist(
    (set) => ({
      students: [],
      setStudents: (students) => set({ students }),
      addStudent: (student) =>
        set((state) => ({ students: [...state.students, student] })),
      clear: () => set({ students: [] }),
    }),
    {
      name: "selected-students-store",
    }
  )
);
export default useSelectedStudentsStore;
