"use client";

import { forwardRef } from "react";
import type { GovCertificateData } from "../types";

interface CertificatePreviewProps {
  formData: GovCertificateData;
}

/**
 * CertificatePreview - Certificado GOV 100% digital
 * Dimensiones exactas: 1366x607px (basado en Certificate.jpg original)
 */
export const CertificatePreview = forwardRef<
  HTMLDivElement,
  CertificatePreviewProps
>(({ formData }, ref) => {
  const courseTitle =
    formData.courseTitle || "DTA STUDENT TRAFFIC OFFENDER PROGRAM (STOP)";
  const deliveryMode = formData.deliveryModeLabel || "In Person Class";
  const providerName =
    formData.providerName || "Affordable Driving & Traffic School";
  const providerPhone = formData.providerPhone || "(561) 969-0150";

  return (
    <div className="bg-white p-2 rounded-lg border-2 border-gray-300">
      <h3 className="text-sm font-semibold mb-2 text-gray-700">Live Preview</h3>

      {/* Certificado - Dimensiones exactas 1366x607 */}
      <div
        ref={ref}
        className="relative bg-white mx-auto overflow-hidden"
        style={{
          width: "1366px",
          height: "670px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* SVG Marco Decorativo - SIN círculos ni puntos */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1366 607"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          {/* Borde exterior principal */}
          <rect
            x="8"
            y="8"
            width="1350"
            height="591"
            fill="none"
            stroke="#c94a3a"
            strokeWidth="5"
          />
          {/* Borde interior */}
          <rect
            x="16"
            y="16"
            width="1334"
            height="575"
            fill="none"
            stroke="#e06b57"
            strokeWidth="2"
          />
        </svg>

        {/* Contenido del Certificado */}
        <div
          className="relative z-10"
          style={{ padding: "45px 100px 60px 100px" }}
        >
          {/* Header: Logo Izq + Título + Logo Der */}
          <div className="flex justify-between items-start mb-5">
            {/* Logo Izquierdo - SIEMPRE visible, doble de tamaño que el derecho */}
            <div
              className="flex-shrink-0 flex items-start justify-center"
              style={{ width: "200px", height: "120px", marginTop: "10px" }}
            >
              <img
                src="/logo-izq.png"
                alt="Logo Driver Training Associates"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
              />
            </div>

            {/* Título Central */}
            <div className="flex-1 text-center px-6">
              <h1
                className="text-4xl font-black text-[#c94a3a] tracking-wide leading-tight"
                style={{ fontFamily: "var(--font-merriweather)" }}
              >
                CERTIFICATE OF COMPLETION
              </h1>
              <p className="text-sm italic text-[#7a3a2e] mt-2">
                This certificate validates that the named person has
                successfully completed a
              </p>
              <p
                className="text-xl font-bold text-[#c94a3a] italic mt-1"
                style={{ fontFamily: "var(--font-merriweather)" }}
              >
                {courseTitle}
              </p>
              <p className="text-sm italic text-[#7a3a2e] mt-1">
                AN UNDER 25 YOUTHFUL OFFENDER COURSE
              </p>
            </div>

            {/* Logo Derecho - SIEMPRE visible */}
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{ width: "120px", height: "100px" }}
            >
              <img
                src="/logo-der.png"
                alt="Logo DTI"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
              />
            </div>
          </div>

          {/* Fila: Course Time CENTRADO + Certificate Number */}
          <div className="flex justify-center items-center mb-4">
            {/* Course Time - CENTRADO */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#c94a3a]">COURSE TIME:</span>
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-1.5 text-sm text-[#c94a3a]">
                  <span
                    className={`w-4 h-4 border-2 border-[#c94a3a] flex items-center justify-center ${
                      formData.courseTime === "4hr" ? "bg-[#c94a3a]" : ""
                    }`}
                  >
                    {formData.courseTime === "4hr" && (
                      <span className="text-white font-bold text-[10px]">
                        ✓
                      </span>
                    )}
                  </span>
                  4hr
                </label>
                <label className="flex items-center gap-1.5 text-sm text-[#c94a3a]">
                  <span
                    className={`w-4 h-4 border-2 border-[#c94a3a] flex items-center justify-center ${
                      formData.courseTime === "6hr" ? "bg-[#c94a3a]" : ""
                    }`}
                  >
                    {formData.courseTime === "6hr" && (
                      <span className="text-white font-bold text-[10px]">
                        ✓
                      </span>
                    )}
                  </span>
                  6hr
                </label>
                <label className="flex items-center gap-1.5 text-sm text-[#c94a3a]">
                  <span
                    className={`w-4 h-4 border-2 border-[#c94a3a] flex items-center justify-center ${
                      formData.courseTime === "8hr" ? "bg-[#c94a3a]" : ""
                    }`}
                  >
                    {formData.courseTime === "8hr" && (
                      <span className="text-white font-bold text-[10px]">
                        ✓
                      </span>
                    )}
                  </span>
                  8hr
                </label>
              </div>
            </div>
          </div>

          {/* Fila: Citation/Case No, Court, County */}
          <div className="flex gap-6 mb-4 text-sm items-center">
            <div className="flex items-baseline gap-2 flex-1">
              <span className="text-[#c94a3a]">Citation/Case No:</span>
              <span className="border-b border-[#c94a3a] flex-1 min-w-[120px] text-black">
                {formData.citationNumber ||
                  formData.citationCaseNo ||
                  "_______________"}
              </span>
            </div>
            <div className="flex items-baseline gap-2 flex-1">
              <span className="text-[#c94a3a]">Court:</span>
              <span className="border-b border-[#c94a3a] flex-1 min-w-[90px] text-black">
                {formData.court || "___________"}
              </span>
            </div>
            <div className="flex items-baseline gap-2 flex-1">
              <span className="text-[#c94a3a]">County:</span>
              <span className="border-b border-[#c94a3a] flex-1 min-w-[90px] text-black">
                {formData.county || "___________"}
              </span>
            </div>
            {/* Certificate Number alineado a la derecha */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              <span className="text-sm text-[#c94a3a]">
                Certificate Number:
              </span>
              <span
                className="text-base font-bold text-[#c94a3a] border-b border-[#c94a3a] min-w-[60px] text-right"
                style={{ display: "inline-block" }}
              >
                {formData.certificateNumber || "____"}
              </span>
            </div>
          </div>

          {/* Fila: Attendance */}
          <div className="flex items-center gap-4 mb-4 text-sm">
            <span className="text-[#c94a3a]">
              Attendance: (reason other than election)
            </span>
            <div className="flex gap-6">
              <label className="flex items-center gap-1.5 text-[#c94a3a]">
                <span
                  className={`w-4 h-4 border-2 border-[#c94a3a] flex items-center justify-center ${
                    formData.attendanceReason === "court_order"
                      ? "bg-[#c94a3a]"
                      : ""
                  }`}
                >
                  {formData.attendanceReason === "court_order" && (
                    <span className="text-white font-bold text-[10px]">✓</span>
                  )}
                </span>
                Court Order
              </label>
              <label className="flex items-center gap-1.5 text-[#c94a3a]">
                <span
                  className={`w-4 h-4 border-2 border-[#c94a3a] flex items-center justify-center ${
                    formData.attendanceReason === "volunteer"
                      ? "bg-[#c94a3a]"
                      : ""
                  }`}
                >
                  {formData.attendanceReason === "volunteer" && (
                    <span className="text-white font-bold text-[10px]">✓</span>
                  )}
                </span>
                Volunteer
              </label>
              <label className="flex items-center gap-1.5 text-[#c94a3a]">
                <span
                  className={`w-4 h-4 border-2 border-[#c94a3a] flex items-center justify-center ${
                    formData.attendanceReason === "ticket" ? "bg-[#c94a3a]" : ""
                  }`}
                >
                  {formData.attendanceReason === "ticket" && (
                    <span className="text-white font-bold text-[10px]">✓</span>
                  )}
                </span>
                Ticket/Citation
              </label>
            </div>
          </div>

          {/* Fila: NAME */}
          <div className="mb-4">
            <div className="text-base font-bold text-[#c94a3a] mb-2">NAME:</div>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="border-b-2 border-[#c94a3a] pb-1 text-center text-black font-semibold">
                  {formData.firstName?.toUpperCase() || "_______________"}
                </div>
                <div className="text-xs text-[#c94a3a] text-center mt-1">
                  FIRST
                </div>
              </div>
              <div className="w-20">
                <div className="border-b-2 border-[#c94a3a] pb-1 text-center text-black font-semibold">
                  {formData.middleInitial?.toUpperCase() || "___"}
                </div>
                <div className="text-xs text-[#c94a3a] text-center mt-1">
                  MI
                </div>
              </div>
              <div className="flex-1">
                <div className="border-b-2 border-[#c94a3a] pb-1 text-center text-black font-semibold">
                  {formData.lastName?.toUpperCase() || "_______________"}
                </div>
                <div className="text-xs text-[#c94a3a] text-center mt-1">
                  LAST
                </div>
              </div>
            </div>
          </div>

          {/* Fila: License, Completion Date, In Person Class */}
          <div className="flex items-center gap-6 mb-6">
            <div className="flex-1">
              <div className="flex items-baseline gap-2 text-sm">
                <span className="text-[#c94a3a]">Drivers License No:</span>
                <span className="border-b border-[#c94a3a] flex-1 text-black">
                  {formData.licenseNumber ||
                    formData.driversLicenseNo ||
                    "______________"}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 text-sm">
                <span className="text-[#c94a3a]">Completion Date:</span>
                <span className="border-b border-[#c94a3a] flex-1 text-black">
                  {formData.completionDate || "______________"}
                </span>
              </div>
            </div>
            <div className="flex-1 text-center">
              {/* Texto cursivo "In Person Class" - tamaño doble */}
              <div
                className="text-8xl md:text-9xl text-[#c94a3a] italic leading-tight font-bold"
                style={{
                  fontFamily: "var(--font-dancing-script)",
                  lineHeight: 1.1,
                }}
              >
                {deliveryMode}
              </div>
            </div>
          </div>

          {/* Fila: Firmas */}
          <div className="flex gap-8 mb-2 mt-0 items-end">
            {/* Firma */}
            <div className="flex-1 flex flex-col justify-end">
              <div className="h-16 flex items-end">
                {formData.instructorSignatureImage ? (
                  <img
                    src={formData.instructorSignatureImage}
                    alt="Signature"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-sm italic text-gray-400">
                    {formData.instructorSignature || ""}
                  </div>
                )}
              </div>
              <div className="border-t-2 border-[#c94a3a] pt-1 text-xs text-[#c94a3a] text-left w-full">
                Instructor's Signature:
              </div>
            </div>
            {/* Línea y label de escuela en el mismo renglón */}
            <div className="flex-1 flex flex-col justify-end">
              <div className="h-16 flex items-end">
                <div
                  className="text-sm text-black font-medium border-b border-[#c94a3a] w-full text-center pb-0.5 leading-tight"
                  style={{ lineHeight: "0.95", minHeight: "1.5em" }}
                >
                  {formData.instructorSchoolName ||
                    formData.instructorsSchoolName ||
                    ""}
                </div>
              </div>
              <div className="border-t border-[#c94a3a] pt-1 text-xs text-[#c94a3a] text-right w-full">
                Instructor's School Name:
              </div>
            </div>
          </div>

          {/* Footer: Provider Info */}
          <div className="flex justify-between items-end mt-0">
            <div className="text-xs text-[#c94a3a]">
              <div>COURSE PROVIDER</div>
              <div className="font-bold">DRIVER TRAINING ASSOCIATES, INC.</div>
              <div>1-800-222-9199</div>
            </div>
            <div className="text-xs text-right">
              <div className="font-semibold text-blue-600">{providerName}</div>
              <div className="font-semibold text-blue-600">{providerPhone}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

CertificatePreview.displayName = "CertificatePreview";
