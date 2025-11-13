"use client";

import Loader from "@/components/custom ui/Loader";
import { Student } from "@/components/ticket/columns";
import { DataTable } from "@/components/ticket/data-table";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ColumnDef } from "@tanstack/react-table";
import { CertificateTemplate } from "@/lib/certificateTypes";

export default function Page() {
  const params = useParams();
  const classId = params.classId as string;
  const classType = (params.classtype || params.classType) as string; // Support both lowercase and uppercase
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState<ColumnDef<Student>[]>([]);
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const router = useRouter();
  const isMounted = useRef(false);

  // Function to generate dynamic columns based on template
  const generateColumns = useCallback((template: CertificateTemplate): ColumnDef<Student>[] => {
    const baseColumns: ColumnDef<Student>[] = [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            aria-label="Select row"
          />
        ),
      },
      {
        accessorKey: "last_name",
        header: "Last Name",
      },
      {
        accessorKey: "first_name",
        header: "First Name",
      },
      {
        accessorKey: "midl",
        header: "Middle Name",
        cell: ({ row }) => {
          const value = row.getValue("midl") as any;
          return value || "-";
        },
      },
      {
        accessorKey: "certn",
        header: "Certificate Number",
      },
    ];

    // Add dynamic columns based on template variables
    if (template && template.availableVariables) {

      template.availableVariables.forEach((variable) => {

        // Skip variables that are already in base columns or redundant
        const skipKeys = [
          'last_name',
          'lastName',
          'first_name',
          'firstName',
          'midl',
          'middleName',
          'middle_name',
          'payedAmount',
          'payed_amount',
          'certn',
          'certificateNumber',
          'certificate_number',
          'studentName',
          'studentFullName',
          'fullName',
          'student_name',
          'student_full_name',
          'classType',
          'classTitle'
        ];
        
        // Also check if the label contains these words
        const skipLabels = [
          'first name',
          'last name',
          'middle name',
          'student name',
          'student full name',
          'full name',
          'payed amount',
          'paid amount',
          'certificate number',
          'class type',
          'class title'
        ];
        
        const shouldSkip = skipKeys.includes(variable.key.toLowerCase()) || 
                          skipLabels.some(label => variable.label.toLowerCase().includes(label));
        
        if (shouldSkip) {

          return;
        }


        // Check if this variable has options (checkbox dropdown)
        const hasOptions = variable.options && variable.options.length > 0;

        baseColumns.push({
          accessorKey: variable.key as keyof Student,
          header: variable.label,
          cell: ({ row }) => {
            const value = row.getValue(variable.key) as any;
            return value || "-";
          },
        });
      });
    }
    

    return baseColumns;
  }, []);

  const fetchInfo = useCallback(async () => {
    setLoading(true);
    try {
      // First, get the ticket class to find the real classId
      const ticketClassResponse = await fetch(`/api/ticket/classes/${classId}`);
      if (!ticketClassResponse.ok) {
        throw new Error('Failed to fetch ticket class');
      }
      
      const ticketClassData = await ticketClassResponse.json();
      const realClassId = ticketClassData.data.classId;
      
      if (!realClassId) {
        throw new Error('No classId found in ticket class');
      }

      // Then, get the driving class information
      const drivingClassResponse = await fetch(`/api/classes/${realClassId}`);
      if (!drivingClassResponse.ok) {
        throw new Error('Failed to fetch driving class');
      }
      
      const drivingClassData = await drivingClassResponse.json();
      
      // Decode class type for display
      const decodedClassType = decodeURIComponent(classType);
      
      // Determine certificate type - use default (date) for non-ADI/BDI types
      const certificateType = (decodedClassType.toLowerCase() === 'adi' || decodedClassType.toLowerCase() === 'bdi') 
        ? decodedClassType.toLowerCase() 
        : 'date';
      
      // Use certificateConfigurations.ts directly (IGNORE database templates)
      const rawCertType = drivingClassData.data.classType || certificateType;
      const certType = rawCertType.toUpperCase().replace(/\s+/g, '-');

      let fetchedTemplate: CertificateTemplate | null = null;

      // ALWAYS use default templates from certificateConfigurations.ts
      {
        const normalizedType = certType.toUpperCase();

        if (normalizedType === 'DATE') {
          const { getDefaultDATETemplate } = await import("@/lib/defaultTemplates/dateTemplate");
          fetchedTemplate = getDefaultDATETemplate();
        } else if (normalizedType === 'ADI') {
          const { getDefaultADITemplate } = await import("@/lib/defaultTemplates/adiTemplate");
          fetchedTemplate = getDefaultADITemplate();
        } else if (normalizedType === '8-HOURS-IDI') {
          const { get8HoursIdiTemplate } = await import("@/lib/defaultTemplates/8hoursIdiTemplate");
          fetchedTemplate = get8HoursIdiTemplate();
        } else if (normalizedType === '8-HOURS-AGGRESSIVE') {
          const { get8HoursAggressiveTemplate } = await import("@/lib/defaultTemplates/8hoursAggressiveTemplate");
          fetchedTemplate = get8HoursAggressiveTemplate();
        } else if (normalizedType === '8-HOURS-SUSPENSION') {
          const { get8HoursSuspensionTemplate } = await import("@/lib/defaultTemplates/8hoursSuspensionTemplate");
          fetchedTemplate = get8HoursSuspensionTemplate();
        } else if (normalizedType === 'YOUTHFUL-OFFENDER-CLASS') {
          const { getYouthfulOffenderTemplate } = await import("@/lib/defaultTemplates/youthfulOffenderTemplate");
          fetchedTemplate = getYouthfulOffenderTemplate();
        } else {
          const { getDefaultBDITemplate } = await import("@/lib/defaultTemplates/bdiTemplate");
          fetchedTemplate = getDefaultBDITemplate(certType);
        }
      }

      // Ensure checkbox variables have options and add checkboxElements as variables
      if (fetchedTemplate) {
        // First, add options to existing variables
        if (fetchedTemplate.availableVariables) {
          fetchedTemplate.availableVariables = fetchedTemplate.availableVariables.map(variable => {
            // Add options for known checkbox variables
            if (variable.key === 'courseTime' && !variable.options) {
              return { ...variable, options: ['4hr', '6hr', '8hr'] };
            }
            if (variable.key === 'attendanceReason' && !variable.options) {
              return { ...variable, options: ['court_order', 'volunteer', 'ticket'] };
            }
            return variable;
          });
        }

        // Add checkboxElements as variables with their options
        if (fetchedTemplate.checkboxElements && fetchedTemplate.checkboxElements.length > 0) {

          const checkboxVariables = fetchedTemplate.checkboxElements.map(checkbox => ({
            key: checkbox.variableKey,
            label: checkbox.title,
            example: checkbox.options[0] || 'Option 1',
            options: checkbox.options
          }));


          // Add checkbox variables to availableVariables if they don't already exist
          checkboxVariables.forEach(checkboxVar => {
            const exists = fetchedTemplate.availableVariables?.some(v => v.key === checkboxVar.key);
            if (!exists) {
              if (!fetchedTemplate.availableVariables) {
                fetchedTemplate.availableVariables = [];
              }
              fetchedTemplate.availableVariables.push(checkboxVar);

            } else {
              // Update existing variable with options if it doesn't have them
              fetchedTemplate.availableVariables = fetchedTemplate.availableVariables.map(v => 
                v.key === checkboxVar.key && !v.options 
                  ? { ...v, options: checkboxVar.options }
                  : v
              );

            }
          });
        }
      }

      setTemplate(fetchedTemplate);
      
      // Finally, get the students
      const studentsResponse = await fetch(`/api/ticket/classes/students/${classId}`);
      if (!studentsResponse.ok) {
        throw new Error('Failed to fetch students');
      }
      
      const studentsData = await studentsResponse.json();
      
      // Add class information to each student
      const studentsWithClassInfo = studentsData.map((student: Student) => ({
        ...student,
        type: certificateType, // Use determined certificate type
        classTitle: drivingClassData.data.title,
        classType: drivingClassData.data.classType,
        // Add default values for school address and phone (editable)
        schoolAddress: student.schoolAddress || '3167 Forest Hill Blvd West Palm Beach, Florida 33406',
        schoolPhone: student.schoolPhone || '(561) 969-0150'
      }));
      
      setStudents(studentsWithClassInfo);
    } catch (error) {
      console.error('Error fetching dynamic class data:', error);
      toast.error('Error loading class information');
    } finally {
      setLoading(false);
    }
  }, [classId, classType, generateColumns]);

  useEffect(() => {
    if (!isMounted.current) {
      fetchInfo();
      isMounted.current = true;
    }
  }, [classId, classType, fetchInfo]);

  // Update columns when template changes
  useEffect(() => {
    if (template) {
      const dynamicColumns = generateColumns(template);
      setColumns(dynamicColumns);
    }
  }, [template, generateColumns]);

  if (loading) {
    return <Loader />;
  }
  
  const navigate = () => {
    // Navigate specifically to the correct classtype page instead of using router.back()
    const normalizedClassType = classType.toLowerCase().replace(/\s+/g, '-');
    router.push(`/ticket/day-of-class/${normalizedClassType}`);
  };

  const onUpdate = async (data: Partial<Student>[]) => {
    for (const student of data) {
      const res = await fetch(`/api/ticket/classes/students/${classId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...student, classId, status: "completed" }),
      });
      if (!res.ok) {
        const { message } = await res.json();
        toast.error(message);
        throw new Error(message);
      }
      toast.success("Updated successfully");
      fetchInfo();
    }
  };
  
  const decodedClassType = decodeURIComponent(classType);
  
  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center bg-gray-800 text-white px-5 py-3 rounded-lg shadow-md">
          <h1 className="text-xl font-semibold">{decodedClassType.toUpperCase()} Tickets</h1>
          <div className="flex items-center space-x-2">
            <Button onClick={navigate} className="hover:scale-110">
              <ArrowLeftIcon size={16} />
            </Button>
          </div>
        </div>
      </div>
      <div className="p-6">
        <DataTable columns={columns} data={students} onUpdate={onUpdate} template={template} />
      </div>
    </>
  );
}
