"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckboxElement } from "./types";
import { Plus, Trash2 } from "lucide-react";

interface CheckboxConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (checkboxElement: CheckboxElement) => void;
}

export function CheckboxConfigModal({ open, onOpenChange, onSave }: CheckboxConfigModalProps) {
  const [title, setTitle] = useState("");
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [options, setOptions] = useState<string[]>(['Option 1', 'Option 2']);
  const [variableKey, setVariableKey] = useState("");

  const handleAddOption = () => {
    setOptions([...options, `Option ${options.length + 1}`]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 1) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSave = () => {
    if (!title.trim() || !variableKey.trim() || options.length === 0) {
      return;
    }

    const checkboxElement: CheckboxElement = {
      id: `checkbox-${Date.now()}`,
      title: title.trim(),
      x: 100,
      y: 100,
      orientation,
      options: options.filter(opt => opt.trim() !== ''),
      variableKey: variableKey.trim(),
      fontSize: 10,
      fontFamily: 'Times-Bold',
      color: '#c94a3a',
      borderColor: '#c94a3a',
      borderWidth: 1.5,
    };

    onSave(checkboxElement);
    
    // Reset form
    setTitle("");
    setOrientation('horizontal');
    setOptions(['Option 1', 'Option 2']);
    setVariableKey("");
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Checkbox Group</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Course Time, Attendance Reason"
            />
          </div>

          <div>
            <Label htmlFor="variableKey">Variable Key</Label>
            <Input
              id="variableKey"
              value={variableKey}
              onChange={(e) => setVariableKey(e.target.value)}
              placeholder="e.g., courseTime, attendanceReason"
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be used to save the selected option as a variable
            </p>
          </div>

          <div>
            <Label htmlFor="orientation">Orientation</Label>
            <Select value={orientation} onValueChange={(value: 'horizontal' | 'vertical') => setOrientation(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="horizontal">Horizontal</SelectItem>
                <SelectItem value="vertical">Vertical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Options</Label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                  />
                  {options.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveOption(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || !variableKey.trim() || options.length === 0}>
            Add Checkbox Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
