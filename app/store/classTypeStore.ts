import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ClassTypeStoreState {
  classType: "date" | "bdi" | "adi";
  setClassType: (classTypeId: "date" | "bdi" | "adi") => void;
}

const useClassTypeStore = create<ClassTypeStoreState>()(
  persist(
    (set) => ({
      classType: "date",
      setClassType: (classType) => {
        set({ classType: classType });
      },
    }),
    {
      name: "class-type-store",
    }
  )
);

export default useClassTypeStore;
