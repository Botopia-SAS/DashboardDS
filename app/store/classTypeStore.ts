import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ClassTypeStoreState {
  classType: string;
  setClassType: (classTypeId: string) => void;
}

const useClassTypeStore = create<ClassTypeStoreState>()(
  persist(
    (set) => ({
      classType: "date",
      setClassType: (classType) => {
        console.log("setClassType", classType);
        set({ classType: classType })
      },
    }),
    {
      name: "class-type-store",
    }
  )
);

export default useClassTypeStore;
