"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDateCertificateGenerator } from "@/components/ticket/hooks/use-date-certificate-generator";

// Mock student data for testing D.A.T.E. certificates
const mockStudent = {
  certn: 47558094,
  courseDate: "Sep 25, 2025",
  citation_number: "DATE001",
  licenseNumber: "D21472038S001",
  last_name: "MARTINEZ",
  first_name: "CARLOS",
  midl: "A",
  address: "1234 MAIN ST. MIAMI, FL 33101",
  instructorName: "Jane Doe",
  id: "test-student-date-1",
  payedAmount: 120,
  birthDate: "1985-08-15",
  reason_attending: "D.A.T.E. Course Completion"
};

export default function DateCertificateTestPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <TestTube className="w-8 h-8" />
          D.A.T.E. Certificate - Test Page
        </h1>
        <p className="text-gray-600">
          Prueba todas las variaciones del generador de certificados D.A.T.E.
        </p>
      </div>

      <Separator />

      {/* Test Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Option 1: Direct Hook Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Opción 1: Uso Directo del Hook
            </CardTitle>
            <p className="text-sm text-gray-600">
              Genera certificado D.A.T.E. directamente usando el hook
            </p>
          </CardHeader>
          <CardContent>
            <DateHookExample student={mockStudent} />
          </CardContent>
        </Card>

        {/* Option 2: Student Data Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Opción 2: Vista Previa de Datos
            </CardTitle>
            <p className="text-sm text-gray-600">
              Revisa los datos que se usarán en el certificado
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Datos del Estudiante Mock:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div><strong>Nombre:</strong> {mockStudent.first_name} {mockStudent.midl} {mockStudent.last_name}</div>
                <div><strong>Certificado:</strong> {mockStudent.certn}</div>
                <div><strong>Fecha del Curso:</strong> {mockStudent.courseDate}</div>
                <div><strong>Fecha Nacimiento:</strong> {mockStudent.birthDate}</div>
                <div><strong>Licencia:</strong> {mockStudent.licenseNumber}</div>
                <div><strong>Citación:</strong> {mockStudent.citation_number}</div>
                <div><strong>Instructor:</strong> {mockStudent.instructorName}</div>
                <div><strong>Monto Pagado:</strong> ${mockStudent.payedAmount}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Option 3: Multiple Test Cases */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Opción 3: Casos de Prueba Múltiples
            </CardTitle>
            <p className="text-sm text-gray-600">
              Prueba con diferentes conjuntos de datos
            </p>
          </CardHeader>
          <CardContent>
            <MultipleTestCases />
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Instrucciones de Prueba D.A.T.E.</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-green-600 mb-2">✅ Qué probar:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Generar certificado con datos mock</li>
                <li>• Verificar que el PDF se descarga correctamente</li>
                <li>• Revisar que todos los campos aparezcan</li>
                <li>• Probar con diferentes nombres y datos</li>
                <li>• Verificar formato y diseño del certificado</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-600 mb-2">🔧 Funcionalidades D.A.T.E.:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Certificado específico para cursos D.A.T.E.</li>
                <li>• Formato PDF con diseño profesional</li>
                <li>• Integración con datos de estudiantes</li>
                <li>• Descarga automática del archivo</li>
                <li>• Validación de datos requeridos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Component to demonstrate D.A.T.E. hook usage
function DateHookExample({ student }: { student: typeof mockStudent }) {
  const { generateDateCertificatePDF } = useDateCertificateGenerator();
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateDateCertificatePDF(student);
      console.log("D.A.T.E. certificate generated successfully");
    } catch (error) {
      console.error("Error generating D.A.T.E. certificate:", error);
      alert("Error al generar el certificado D.A.T.E.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium mb-2">Datos del Estudiante:</h4>
        <p className="text-sm text-blue-800">
          <strong>{student.first_name} {student.midl} {student.last_name}</strong><br />
          Certificado: {student.certn}<br />
          Fecha: {student.courseDate}
        </p>
      </div>
      
      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full"
      >
        {isGenerating ? "Generando Certificado..." : "Generar Certificado D.A.T.E."}
      </Button>
    </div>
  );
}

// Component for multiple test cases
function MultipleTestCases() {
  const { generateDateCertificatePDF } = useDateCertificateGenerator();
  const [generating, setGenerating] = React.useState<string | null>(null);

  const testCases = [
    {
      id: "case1",
      name: "Caso Estándar",
      student: { ...mockStudent, first_name: "MARIA", last_name: "GONZALEZ", certn: 47558001 }
    },
    {
      id: "case2", 
      name: "Nombre Largo",
      student: { ...mockStudent, first_name: "ALEJANDRO", last_name: "RODRIGUEZ-MARTINEZ", midl: "FERNANDO", certn: 47558002 }
    },
    {
      id: "case3",
      name: "Sin Inicial",
      student: { ...mockStudent, first_name: "ANA", last_name: "LOPEZ", midl: "", certn: 47558003 }
    }
  ];

  const handleGenerateTestCase = async (testCase: typeof testCases[0]) => {
    setGenerating(testCase.id);
    try {
      await generateDateCertificatePDF(testCase.student);
      console.log(`Test case ${testCase.name} generated successfully`);
    } catch (error) {
      console.error(`Error generating test case ${testCase.name}:`, error);
      alert(`Error al generar certificado para ${testCase.name}`);
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {testCases.map((testCase) => (
        <Card key={testCase.id} className="p-4">
          <h4 className="font-medium mb-2">{testCase.name}</h4>
          <p className="text-sm text-gray-600 mb-3">
            {testCase.student.first_name} {testCase.student.midl} {testCase.student.last_name}
          </p>
          <Button
            onClick={() => handleGenerateTestCase(testCase)}
            disabled={generating === testCase.id}
            size="sm"
            variant="outline"
            className="w-full"
          >
            {generating === testCase.id ? "Generando..." : "Generar"}
          </Button>
        </Card>
      ))}
    </div>
  );
}