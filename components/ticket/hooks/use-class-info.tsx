"use client";

import { useCallback } from "react";

interface ClassInfo {
  title: string;
  classType: string;
}

export function useClassInfo() {
  const getClassInfo = useCallback(async (ticketClassId: string): Promise<ClassInfo | null> => {
    try {
      // First, get the ticket class to find the real classId
      const ticketClassResponse = await fetch(`/api/ticket/classes/${ticketClassId}`);
      if (!ticketClassResponse.ok) {
        console.error('Failed to fetch ticket class');
        return null;
      }
      
      const ticketClassData = await ticketClassResponse.json();
      const realClassId = ticketClassData.classId;
      
      if (!realClassId) {
        console.error('No classId found in ticket class');
        return null;
      }

      // Then, get the driving class information
      const drivingClassResponse = await fetch(`/api/classes/${realClassId}`);
      if (!drivingClassResponse.ok) {
        console.error('Failed to fetch driving class');
        return null;
      }
      
      const drivingClassData = await drivingClassResponse.json();
      
      return {
        title: drivingClassData.title || 'Certificate Course',
        classType: drivingClassData.classType || 'DATE'
      };
    } catch (error) {
      console.error('Error fetching class info:', error);
      return null;
    }
  }, []);

  return { getClassInfo };
}
