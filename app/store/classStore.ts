import { create } from "zustand";
import { persist } from "zustand/middleware";

// Definir la interfaz del estado
interface ClassStoreState {
  classId: string;
  setClassId: (classId: string) => void;
}

// Crear el store con tipado
const useClassStore = create<ClassStoreState>()(
  persist(
    (set) => ({
      classId: "",
      setClassId: (classId) => set({ classId }),
    }),
    {
      name: "class-store",
    }
  )
);

export default useClassStore;
