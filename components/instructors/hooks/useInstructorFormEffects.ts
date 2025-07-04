import { useEffect } from "react";
import { InstructorData, Slot, User } from "../types";
import toast from "react-hot-toast";

type UseInstructorFormEffectsParams = {
  initialData: InstructorData | undefined;
  schedule: Slot[];
  setSchedule: (s: Slot[]) => void;
  scheduleDraftKey: string | undefined;
  setLoadingSchedule: (b: boolean) => void;
  setLocations: (l: { _id: string; title: string }[]) => void;
  setAllUsers: (u: User[]) => void;
  isModalOpen: boolean;
  loadInstructorTicketClasses: () => Promise<void>;
  instructorTicketClassesLoaded: boolean;
  setHasChanges: (b: boolean) => void;
  calculateScheduleChangesProfessional: (original: Slot[], current: Slot[]) => any;
};

export function useInstructorFormEffects({
  initialData,
  schedule,
  setSchedule,
  scheduleDraftKey,
  setLoadingSchedule,
  setLocations,
  setAllUsers,
  isModalOpen,
  loadInstructorTicketClasses,
  instructorTicketClassesLoaded,
  setHasChanges,
  calculateScheduleChangesProfessional,
}: UseInstructorFormEffectsParams) {
  // Efecto para cargar el schedule y ticket classes al inicio
  useEffect(() => {
    let isMounted = true;
    async function loadSchedule() {
      if (!isMounted) return;
      setLoadingSchedule(true);
      try {
        await loadInstructorTicketClasses();
        if (!isMounted) return;
        const originalSchedule = initialData?.schedule || [];
        setSchedule(originalSchedule);
        setLoadingSchedule(false);
      } catch (error) {
        if (isMounted) {
          setLoadingSchedule(false);
        }
      }
    }
    loadSchedule();
    return () => {
      isMounted = false;
    };
  }, [initialData]);

  // Efecto para cargar ticket classes al inicio si no están cargadas
  useEffect(() => {
    let isMounted = true;
    if (initialData?._id && !instructorTicketClassesLoaded) {
      loadInstructorTicketClasses().catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [initialData?._id]);

  // Guardar draft en localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && scheduleDraftKey) {
      localStorage.setItem(scheduleDraftKey, JSON.stringify(schedule));
    }
  }, [schedule, scheduleDraftKey]);

  // Detectar cambios en el schedule
  useEffect(() => {
    const originalSchedule = initialData?.schedule || [];
    const changes = calculateScheduleChangesProfessional(originalSchedule, schedule);
    const hasRealChanges = changes.toCreate.length > 0 || changes.toUpdate.length > 0 || changes.toDelete.length > 0;
    setHasChanges(hasRealChanges);
  }, [schedule, initialData]);

  // Cargar usuarios cuando se abre el modal
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        const users = await res.json();
        const filtered = users
          .filter((u: User) => u.role?.toLowerCase() === "user")
          .map((u: User) => ({
            ...u,
            name: u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim(),
          }));
        setAllUsers(filtered);
      } catch {
        toast.error("Could not load students.");
      }
    };
    if (isModalOpen) {
      fetchUsers();
    }
  }, [isModalOpen]);

  // Cargar ubicaciones
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch("/api/locations");
        const data = await res.json();
        setLocations(data);
      } catch {
        toast.error("Could not load locations");
      }
    };
    fetchLocations();
  }, []);
} 