"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface PaymentMethodModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  onSelectPaymentMethod: (method: string) => void;
}

export function PaymentMethodModal({
  isOpen,
  onOpenChange,
  onSave,
  onSelectPaymentMethod,
}: PaymentMethodModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Payment Method</DialogTitle>
        </DialogHeader>
        <Select onValueChange={onSelectPaymentMethod}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a payment method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Cash">Cash</SelectItem>
            <SelectItem value="Visa">Visa</SelectItem>
            <SelectItem value="Mastercard">Mastercard</SelectItem>
            <SelectItem value="Money Order">Money Order</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button onClick={onSave} className="bg-blue-500 text-white">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
