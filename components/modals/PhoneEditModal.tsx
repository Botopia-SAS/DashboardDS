"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PhoneEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhone: string;
  onSave: (phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
}

export default function PhoneEditModal({
  isOpen,
  onClose,
  currentPhone,
  onSave
}: PhoneEditModalProps) {
  const [phoneNumber, setPhoneNumber] = useState(currentPhone);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setPhoneNumber(currentPhone);
  }, [currentPhone]);

  const handleSave = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Phone number is required');
      return;
    }

    // Basic phone number validation
    const phoneRegex = /^[\+]?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(phoneNumber)) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await onSave(phoneNumber);
      
      if (result.success) {
        toast.success('Phone number updated successfully');
        onClose();
      } else {
        toast.error(result.error || 'Failed to update phone number');
      }
    } catch (error) {
      toast.error('An error occurred while updating the phone number');
      console.error('Error updating phone:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setPhoneNumber(currentPhone);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Edit Phone Number
          </DialogTitle>
          <DialogDescription>
            Update the main contact phone number for your business.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone
            </Label>
            <Input
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(555) 123-4567"
              className="col-span-3"
              disabled={isLoading}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading || !phoneNumber.trim()}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
