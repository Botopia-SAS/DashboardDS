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
import { getYouthfulOffenderTemplate } from "@/lib/defaultTemplates/youthfulOffenderTemplate";
import { useDynamicCertificateGenerator } from "@/components/ticket/hooks/use-dynamic-certificate-generator";

export default function YouthfulOffenderClassRecordsPage() {
  const params = useParams();
  const classId = params.classId as string;
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const router = useRouter();
  const isMounted = useRef(false);
  const { generateMultipleCertificatesPDF } = useDynamicCertificateGenerator();

  // Fixed columns for Youthful Offender Class
  const columns: ColumnDef<Student>[] = [
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
    },
    {
      accessorKey: "certn",
      header: "Certificate Number",
    },
    {
      accessorKey: "courseTime",
      header: "Course Time",
      cell: ({ row }) => {
        const value = row.getValue("courseTime") as string;
        return value || "-";
      },
    },
    {
      accessorKey: "attendanceReason",
      header: "Attendance",
      cell: ({ row }) => {
        const value = row.getValue("attendanceReason") as string;
        return value || "-";
      },
    },
    {
      accessorKey: "citation_number",
      header: "Citation #",
      cell: ({ row }) => {
        const value = row.getValue("citation_number") as string;
        return value || "-";
      },
    },
    {
      accessorKey: "court",
      header: "Court",
      cell: ({ row }) => {
        const value = row.getValue("court") as string;
        return value || "-";
      },
    },
    {
      accessorKey: "county",
      header: "County",
      cell: ({ row }) => {
        const value = row.getValue("county") as string;
        return value || "-";
      },
    },
    {
      accessorKey: "licenseNumber",
      header: "License #",
      cell: ({ row }) => {
        const value = row.getValue("licenseNumber") as string;
        return value || "-";
      },
    },
    {
      accessorKey: "courseDate",
      header: "Completion Date",
      cell: ({ row }) => {
        const value = row.getValue("courseDate") as string;
        return value || "-";
      },
    },
  ];

  const fetchInfo = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch students
      console.log('📥 Fetching students for class:', classId);
      const studentsResponse = await fetch(`/api/ticket/classes/students/${classId}`);
      if (!studentsResponse.ok) {
        throw new Error('Failed to fetch students');
      }

      const studentsData = await studentsResponse.json();
      console.log('👥 Students loaded:', studentsData);
      // API returns array directly, not { students: [] }
      setStudents(Array.isArray(studentsData) ? studentsData : []);

      // Use template directly from code instead of database
      console.log('📋 Loading youthful offender template from code...');
      const youthfulTemplate = getYouthfulOffenderTemplate() as CertificateTemplate;
      setTemplate(youthfulTemplate);
      console.log('✅ Template loaded:', youthfulTemplate.name);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load class data');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      fetchInfo();
    }
  }, [fetchInfo]);

  const onUpdate = async (updatedData: Partial<Student>[]) => {
    try {
      console.log('💾 Saving updates:', updatedData);

      for (const update of updatedData) {
        // Send all fields directly in the body (API expects flat structure)
        const response = await fetch(`/api/ticket/classes/students/${classId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update), // Send update object directly, not wrapped
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to update student ${update.id}`);
        }
      }

      toast.success('Changes saved successfully');
      fetchInfo(); // Refresh data

    } catch (error) {
      console.error('Error updating students:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save changes');
      throw error;
    }
  };

  // Test function to generate certificates with hardcoded data
  const handleTestCertificates = async () => {
    if (!template) {
      toast.error('Template not loaded yet');
      return;
    }

    try {
      console.log('🧪 Generating TEST certificates with hardcoded data');

      const testStudents: Student[] = [
        {
          id: 'test1',
          first_name: 'JOHN',
          last_name: 'DOE',
          midl: 'M',
          certn: 100,
          payedAmount: 0,
          birthDate: '1990-01-01',
          licenseNumber: 'A1234567',
          citation_number: '12345',
          court: 'Court 1',
          county: 'Miami-Dade',
          courseDate: '12/24/2025',
          courseTime: '6 hr',
          attendanceReason: 'Volunteer',
        },
        {
          id: 'test2',
          first_name: 'JANE',
          last_name: 'SMITH',
          midl: 'A',
          certn: 101,
          payedAmount: 0,
          birthDate: '1992-05-15',
          licenseNumber: 'B9876543',
          citation_number: '67890',
          court: 'Court 2',
          county: 'Broward',
          courseDate: '12/24/2025',
          courseTime: '4 hr',
          attendanceReason: 'Court Order',
        },
        {
          id: 'test3',
          first_name: 'BOB',
          last_name: 'JOHNSON',
          midl: 'R',
          certn: 102,
          payedAmount: 0,
          birthDate: '1988-12-30',
          licenseNumber: 'C5555555',
          citation_number: '11111',
          court: 'Court 3',
          county: 'Palm Beach',
          courseDate: '12/24/2025',
          courseTime: '8 hr',
          attendanceReason: 'Ticket/Citation',
        },
      ];

      const pdfBlob = await generateMultipleCertificatesPDF(testStudents, template);

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TEST_Certificates_3_students.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Test certificates generated!');
    } catch (error) {
      console.error('Error generating test certificates:', error);
      toast.error('Failed to generate test certificates');
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center bg-gray-800 text-white px-5 py-3 rounded-lg shadow-md">
          <h1 className="text-xl font-semibold">YOUTHFUL-OFFENDER-CLASS Tickets</h1>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleTestCertificates}
              className="bg-green-600 hover:bg-green-700"
              disabled={!template}
            >
              🧪 Test 3 Certificates
            </Button>
            <Button onClick={() => router.back()} className="hover:scale-110">
              <ArrowLeftIcon size={16} />
            </Button>
          </div>
        </div>
      </div>
      <div className="p-6">
        <DataTable
          columns={columns}
          data={students}
          onUpdate={onUpdate}
          template={template}
        />
      </div>
    </>
  );
}
