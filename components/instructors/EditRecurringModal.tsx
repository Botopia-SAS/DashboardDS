// EditRecurringModal.tsx
// Modal para decidir si editar solo un evento o todos los futuros de una recurrencia.

import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";

interface EditRecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  setEditAll: (value: boolean) => void;
  setIsModalOpen: (value: boolean) => void;
}

const EditRecurringModal = ({
  isOpen,
  onClose,
  setEditAll,
  setIsModalOpen,
}: EditRecurringModalProps) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 flex items-center justify-center z-50"
    >
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
        <h2 className="text-lg font-bold mb-4">Edit Recurring Event</h2>
        <p>Do you want to edit this event only or all future occurrences?</p>
        <div className="mt-4 flex justify-between">
          <Button
            onClick={() => {
              setEditAll(false);
              setIsModalOpen(true);
              onClose();
            }}
          >
            This Event Only
          </Button>
          <Button
            onClick={() => {
              setEditAll(true);
              setIsModalOpen(true);
              onClose();
            }}
          >
            All Future Events
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default EditRecurringModal; 