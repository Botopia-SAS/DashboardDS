import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ClassTypeOption {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface ClassTypeStoreState {
  classType: string;
  availableClassTypes: ClassTypeOption[];
  setClassType: (classTypeId: string) => void;
  setAvailableClassTypes: (classTypes: ClassTypeOption[]) => void;
  addClassType: (classType: ClassTypeOption) => void;
  removeClassType: (id: string) => void;
}

const useClassTypeStore = create<ClassTypeStoreState>()(
  persist(
    (set, get) => ({
      classType: "date",
      availableClassTypes: [],
      setClassType: (classType) => {
        set({ classType });
      },
      setAvailableClassTypes: (availableClassTypes) => {
        set({ availableClassTypes });
      },
      addClassType: (classType) => {
        const currentTypes = get().availableClassTypes;
        const exists = currentTypes.find(ct => ct._id === classType._id);
        if (!exists) {
          set({
            availableClassTypes: [...currentTypes, classType]
          });
        }
      },
      removeClassType: (id) => {
        const currentTypes = get().availableClassTypes;
        set({
          availableClassTypes: currentTypes.filter(ct => ct._id !== id)
        });
      },
    }),
    {
      name: "class-type-store",
    }
  )
);

export default useClassTypeStore;
