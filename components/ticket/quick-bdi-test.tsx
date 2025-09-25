"use client";

import React from "react";
import BdiCertificateModal from "@/components/ticket/bdi-certificate-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

export default function QuickBdiTest() {
  const handleDownload = (data: any) => {
    console.log("✅ Certificate downloaded successfully:", data);
    alert(`🎉 ¡Certificado descargado exitosamente!\n\nEstudiante: ${data.studentName}\nCertificado: ${data.certificateNumber}`);
  };

  return (
    <Card className="max-w-2xl mx-auto m-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-center">
          <FileText className="w-6 h-6 text-blue-600" />
          Prueba Rápida - Certificado BDI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <p className="text-gray-600">
            Haz clic en el botón para probar el generador de certificados BDI
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Test with default data */}
            <BdiCertificateModal
              trigger={
                <Button className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Generar con Datos por Defecto
                </Button>
              }
              onDownload={handleDownload}
            />
            
            {/* Test with custom data */}
            <BdiCertificateModal
              trigger={
                <Button variant="outline" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Generar con Datos Personalizados
                </Button>
              }
              initialData={{
                certificateNumber: "TEST2025",
                studentName: "SMITH, JOHN",
                citationNumber: "CUSTOM123",
                citationCounty: "BROWARD",
                driversLicenseNumber: "S12345678901",
                dateOfBirth: "5/15/1985",
                reasonAttending: "Traffic Violation",
                courseProvider: "SAFE DRIVING SCHOOL",
                schoolName: "PROFESSIONAL TRAFFIC SCHOOL"
              }}
              onDownload={handleDownload}
            />
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">✅ Qué verificar:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Los campos se pueden editar</li>
            <li>• La vista previa se actualiza en tiempo real</li>
            <li>• El PDF se descarga correctamente</li>
            <li>• No aparece "Main Menu" en el certificado</li>
            <li>• El formato coincide con la imagen de referencia</li>
          </ul>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">📱 Acceso rápido:</h3>
          <p className="text-sm text-green-700">
            Visita: <code className="bg-white px-2 py-1 rounded">/ticket</code> → pestaña "B.D.I." → "🧪 Test BDI Certificate"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}