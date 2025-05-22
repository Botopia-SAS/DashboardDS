"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  CreditCard,
  DollarSign,
  LucideIcon,
  Banknote,
  Receipt,
} from "lucide-react";

interface PaymentMethodModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  onSelectPaymentMethod: (method: string) => void;
}

interface PaymentOption {
  value: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export function PaymentMethodModal({
  isOpen,
  onOpenChange,
  onSave,
  onSelectPaymentMethod,
}: PaymentMethodModalProps) {
  const paymentOptions: PaymentOption[] = [
    {
      value: "Cash",
      label: "Cash",
      icon: DollarSign,
      description: "Cash payment received in person",
    },
    {
      value: "Visa",
      label: "Visa",
      icon: CreditCard,
      description: "Payment via Visa credit or debit card",
    },
    {
      value: "Mastercard",
      label: "Mastercard",
      icon: CreditCard,
      description: "Payment via Mastercard credit or debit card",
    },
    {
      value: "Money Order",
      label: "Money Order",
      icon: Receipt,
      description: "Payment via money order or cashier's check",
    },
    {
      value: "Other",
      label: "Other",
      icon: Banknote,
      description: "Other payment method",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            Payment Method
          </DialogTitle>
          <DialogDescription className="text-center text-gray-500">
            Select the payment method used for this transaction
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Select onValueChange={onSelectPaymentMethod}>
            <SelectTrigger className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 py-10">
              <SelectValue placeholder="Choose a payment method" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {paymentOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="hover:bg-gray-100 cursor-pointer py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{option.label}</p>
                        <p className="text-xs text-gray-500">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="sm:justify-end">
          <Button
            onClick={onSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md transition-colors duration-200"
          >
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
