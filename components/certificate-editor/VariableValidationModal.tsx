"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { CertificateTemplate, DEFAULT_VARIABLES } from "./types";

interface VariableValidationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: CertificateTemplate;
  user: any; // Add user data to the modal
  onProceed: () => void;
  onAddMissingVariables: (variables: string[]) => void;
}

interface VariableStatus {
  key: string;
  label: string;
  used: boolean;
  missing: boolean;
  source: 'user' | 'ticket' | 'derived';
}

export function VariableValidationModal({
  open,
  onOpenChange,
  template,
  user,
  onProceed,
  onAddMissingVariables
}: VariableValidationModalProps) {
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);

  // Extract all variables used in the template
  const extractUsedVariables = (template: CertificateTemplate | null): string[] => {
    const variables: string[] = [];
    
    // Return empty array if template is null
    if (!template || !template.textElements) {
      return variables;
    }
    
    // Check text elements
    template.textElements.forEach(element => {
      if (element && element.content) {
        const matches = element.content.match(/\{\{([^}]+)\}\}/g);
        if (matches) {
          matches.forEach(match => {
            const variable = match.replace(/\{\{|\}\}/g, '');
            if (!variables.includes(variable)) {
              variables.push(variable);
            }
          });
        }
      }
    });

    return variables;
  };

  // Check which variables are missing from the student data
  const checkVariableStatus = (): VariableStatus[] => {
    // Return empty array if template is null
    if (!template) {
      return [];
    }
    
    const usedVariables = extractUsedVariables(template);
    
    return DEFAULT_VARIABLES.map(variable => {
      const used = usedVariables.includes(variable.key);
      const missing = used && !isVariableAvailable(variable.key);
      
      return {
        key: variable.key,
        label: variable.label,
        used,
        missing,
        source: getVariableSource(variable.key)
      };
    }).filter(v => v.used); // Only show variables that are actually used
  };

  const isVariableAvailable = (variableKey: string): boolean => {
    if (!user) return false;
    
    // Use the same logic as the main validation function
    switch (variableKey) {
      case 'firstName':
        return !!user.first_name;
      case 'lastName':
        return !!user.last_name;
      case 'birthDate':
        return !!user.birthDate;
      case 'licenseNumber':
        // License number is optional - always return true
        return true;
      case 'courseDate':
        return !!user.courseDate;
      case 'classType':
        return !!user.classType;
      case 'certn':
        return !!user.certn;
      case 'address':
        return !!(user.address || user.locationId);
      case 'courseTime':
        return !!(user.courseTime || user.duration);
      case 'classTitle':
        return !!user.classTitle;
      case 'citationNumber':
        return !!user.citation_number;
      default:
        return true;
    }
  };

  const getVariableSource = (variableKey: string): 'user' | 'ticket' | 'derived' => {
    const userVariables = ['firstName', 'lastName', 'birthDate', 'licenseNumber'];
    const ticketVariables = ['courseDate', 'classType', 'certn', 'citationNumber'];
    const derivedVariables = ['address', 'courseTime', 'classTitle']; // Derived from other data
    
    if (userVariables.includes(variableKey)) return 'user';
    if (ticketVariables.includes(variableKey)) return 'ticket';
    if (derivedVariables.includes(variableKey)) return 'derived';
    return 'derived';
  };

  const variableStatuses = checkVariableStatus();
  const missingVariables = variableStatuses.filter(v => v.missing);
  const hasMissingVariables = missingVariables.length > 0;

  const handleVariableToggle = (variableKey: string, checked: boolean) => {
    if (checked) {
      setSelectedVariables(prev => [...prev, variableKey]);
    } else {
      setSelectedVariables(prev => prev.filter(v => v !== variableKey));
    }
  };

  const handleAddMissingVariables = () => {
    onAddMissingVariables(selectedVariables);
    onOpenChange(false);
  };

  const handleProceedAnyway = () => {
    onProceed();
    onOpenChange(false);
  };

  // Don't render if template is null
  if (!template) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Certificate Variables Validation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <Alert className={hasMissingVariables ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"}>
            <div className="flex items-center gap-2">
              {hasMissingVariables ? (
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
              <AlertDescription className="font-medium">
                {hasMissingVariables 
                  ? `Found ${missingVariables.length} missing variable(s) in the certificate`
                  : "All variables are available"
                }
              </AlertDescription>
            </div>
          </Alert>

          {/* Variables Status */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-700">Variables Used in the Certificate:</h3>
            <div className="space-y-2">
              {variableStatuses.map(variable => (
                <div key={variable.key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {variable.missing ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    <div>
                      <span className="font-medium">{variable.label}</span>
                      <Badge 
                        variant="outline" 
                        className="ml-2 text-xs"
                      >
                        {variable.source === 'user' ? 'User' : 
                         variable.source === 'ticket' ? 'Ticket' : 'Derived'}
                      </Badge>
                    </div>
                  </div>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {`{{${variable.key}}}`}
                  </code>
                </div>
              ))}
            </div>
          </div>

          {/* Missing Variables Options */}
          {hasMissingVariables && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-700">Missing Variables - Options:</h3>
              <div className="space-y-2">
                {missingVariables.map(variable => (
                  <div key={variable.key} className="flex items-center space-x-2 p-2 border border-yellow-200 rounded-lg bg-yellow-50">
                    <Checkbox
                      id={variable.key}
                      checked={selectedVariables.includes(variable.key)}
                      onCheckedChange={(checked) => handleVariableToggle(variable.key, checked as boolean)}
                    />
                    <label htmlFor={variable.key} className="text-sm font-medium">
                      Add &quot;{variable.label}&quot; field as optional
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          
          {hasMissingVariables && (
            <Button 
              variant="secondary" 
              onClick={handleAddMissingVariables}
              disabled={selectedVariables.length === 0}
            >
              Add Selected Variables
            </Button>
          )}
          
          <Button 
            onClick={handleProceedAnyway}
            className={hasMissingVariables ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"}
          >
            {hasMissingVariables ? "Continue Without Variables" : "Generate Certificate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
