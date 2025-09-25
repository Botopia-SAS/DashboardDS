"use client";

import React from "react";
import BdiCertificate from "@/components/ticket/bdi-certificate";
import BdiCertificateModal from "@/components/ticket/bdi-certificate-modal";
import { BdiCertificateButton } from "@/components/ticket/bdi-certificate-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, TestTube } from "lucide-react";

// Mock student data for testing
const mockStudent = {
  certn: 47558093,
  courseDate: "Sep 10, 2025",
  citation_number: "ALONJJE",
  licenseNumber: "C21472038S000",
  last_name: "CALDERON",
  first_name: "ROMELIA",
  midl: "",
  address: "3167 FOREST HILL BLVD. WEST PALM BEACH, FL 33406",
  instructorName: "John Smith",
  id: "test-student-1",
  payedAmount: 150,
  birthDate: "1974-04-04",
  reason_attending: "BDI BDI Election"
};

export default function BdiCertificateTestPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <TestTube className="w-8 h-8" />
          BDI Certificate - Test Page
        </h1>
        <p className="text-gray-600">
          Prueba todas las variaciones del generador de certificados BDI
        </p>
      </div>

      <Separator />

      {/* Test Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Option 1: Full Component */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Opción 1: Componente Completo
            </CardTitle>
            <p className="text-sm text-gray-600">
              Página completa con formulario y vista previa
            </p>
          </CardHeader>
          <CardContent>
            <BdiCertificate />
          </CardContent>
        </Card>

        {/* Option 2: Modal Component */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Opción 2: Modal Reutilizable
            </CardTitle>
            <p className="text-sm text-gray-600">
              Modal para integrar en tablas existentes
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Modal with default trigger */}
            <BdiCertificateModal 
              onDownload={(data) => {
                console.log("Certificate downloaded:", data);
                alert(`Certificado descargado para: ${data.studentName}`);
              }}
            />
            
            {/* Modal with custom initial data */}
            <BdiCertificateModal
              initialData={{
                certificateNumber: "TEST123",
                studentName: "DOE, JANE",
                citationNumber: "CUSTOM001",
                citationCounty: "BROWARD",
                driversLicenseNumber: "D12345678901",
                dateOfBirth: "1/1/1990",
                reasonAttending: "Court Order"
              }}
              onDownload={(data) => {
                console.log("Custom certificate downloaded:", data);
                alert(`Certificado personalizado descargado para: ${data.studentName}`);
              }}
            />
          </CardContent>
        </Card>

        {/* Option 3: Integration Button */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Opción 3: Botón de Integración
            </CardTitle>
            <p className="text-sm text-gray-600">
              Botón que mapea automáticamente datos de estudiante
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Datos del Estudiante Mock:</h4>
              <pre className="text-xs text-gray-600 mb-4">
{JSON.stringify(mockStudent, null, 2)}
              </pre>
              
              <div className="flex flex-wrap gap-2">
                <BdiCertificateButton 
                  student={mockStudent}
                  variant="default"
                  size="sm"
                />
                
                <BdiCertificateButton 
                  student={mockStudent}
                  variant="outline"
                  size="default"
                />
                
                <BdiCertificateButton 
                  student={mockStudent}
                  variant="ghost"
                  size="lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Option 4: Hook Usage Example */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Opción 4: Uso Directo del Hook
            </CardTitle>
            <p className="text-sm text-gray-600">
              Ejemplo de uso directo del hook personalizado
            </p>
          </CardHeader>
          <CardContent>
            <HookUsageExample />
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Instrucciones de Prueba</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-green-600 mb-2">✅ Qué probar:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Editar todos los campos del formulario</li>
                <li>• Verificar la vista previa en tiempo real</li>
                <li>• Descargar el PDF y revisar el contenido</li>
                <li>• Probar con diferentes navegadores</li>
                <li>• Verificar que no aparezca &ldquo;Main Menu&rdquo;</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-600 mb-2">🔧 Funcionalidades:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Todos los campos son editables</li>
                <li>• Descarga automática en PDF</li>
                <li>• Vista previa exacta del certificado</li>
                <li>• Integración con datos existentes</li>
                <li>• Diseño responsive</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Component to demonstrate hook usage
function HookUsageExample() {
  const [isDownloading, setIsDownloading] = React.useState(false);
  
  const handleDirectDownload = async () => {
    setIsDownloading(true);
    
    try {
      // Dynamically import the hook to avoid SSR issues
      const { useBdiCertificateDownloader } = await import("@/components/ticket/hooks/use-bdi-certificate-downloader");
      
      // Note: This is just for demonstration. In a real component, you'd use the hook normally
      const sampleData = {
        certificateNumber: "HOOK123",
        printDate: "Sep 25, 2025",
        courseCompletionDate: "Sep 25, 2025",
        citationNumber: "HOOK001",
        citationCounty: "MIAMI-DADE",
        courseProvider: "DRIVESAFELY",
        providerPhone: "7024857907",
        schoolName: "AFFORDABLE DRIVING TRAFFIC SCHOOL",
        schoolPhone: "5619690150",
        driversLicenseNumber: "H00K12345678",
        studentName: "HOOK, EXAMPLE",
        dateOfBirth: "12/25/1985",
        reasonAttending: "Hook Test Example"
      };
      
      console.log("Downloading with hook:", sampleData);
      alert("Esta es una demostración del hook. En un componente real, usarías el hook directamente.");
      
    } catch (error) {
      console.error("Error:", error);
      alert("Error en la demostración del hook");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium mb-2">Código de ejemplo:</h4>
        <pre className="text-xs text-blue-800 whitespace-pre-wrap">
{`import { useBdiCertificateDownloader } from "./hooks/use-bdi-certificate-downloader";

function MyComponent() {
  const { downloadBdiCertificate } = useBdiCertificateDownloader();
  
  const handleDownload = async () => {
    const success = await downloadBdiCertificate({
      certificateNumber: "123456",
      studentName: "DOE, JOHN",
      // ... más campos
    });
  };
  
  return <button onClick={handleDownload}>Download</button>;
}`}
        </pre>
      </div>
      
      <button
        onClick={handleDirectDownload}
        disabled={isDownloading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isDownloading ? "Procesando..." : "Demostrar Hook"}
      </button>
    </div>
  );
}