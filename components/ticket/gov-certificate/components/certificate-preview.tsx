"use client";

import { forwardRef } from "react";
import type { GovCertificateData } from "../types";

interface CertificatePreviewProps {
  formData: GovCertificateData;
}

export const CertificatePreview = forwardRef<HTMLDivElement, CertificatePreviewProps>(
  ({ formData }, ref) => {
    return (
      <div className="bg-white p-4 rounded-lg border-2 border-gray-300 overflow-auto">
        <h3 className="text-sm font-semibold mb-3 text-gray-700">Live Preview</h3>
        <div ref={ref} className="relative w-full" style={{ aspectRatio: "1275/540" }}>
          <img
            src="/Certificate.jpg"
            alt="Certificate Template"
            className="w-full h-full object-contain"
          />

          {/* Certificate Number */}
          {formData.certificateNumber && (
            <div
              className="absolute text-red-700 font-bold text-lg"
              style={{ top: "50.5%", left: "87%", transform: "translate(-50%, -50%)" }}
            >
              {formData.certificateNumber}
            </div>
          )}

          {/* Course Time Checkboxes */}
          {formData.courseTime === "4hr" && (
            <div className="absolute text-red-700 font-bold text-sm" style={{ top: "32.8%", left: "46.8%" }}>
              X
            </div>
          )}
          {formData.courseTime === "6hr" && (
            <div className="absolute text-red-700 font-bold text-sm" style={{ top: "32.8%", left: "54.2%" }}>
              X
            </div>
          )}
          {formData.courseTime === "8hr" && (
            <div className="absolute text-red-700 font-bold text-sm" style={{ top: "32.8%", left: "61.5%" }}>
              X
            </div>
          )}

          {/* Citation Number */}
          {formData.citationNumber && (
            <div
              className="absolute text-black text-[10px]"
              style={{ top: "44.5%", left: "19.5%", transform: "translateY(-50%)" }}
            >
              {formData.citationNumber}
            </div>
          )}

          {/* Court */}
          {formData.court && (
            <div
              className="absolute text-black text-[10px]"
              style={{ top: "44.5%", left: "45%", transform: "translateY(-50%)" }}
            >
              {formData.court}
            </div>
          )}

          {/* County */}
          {formData.county && (
            <div
              className="absolute text-black text-[10px]"
              style={{ top: "44.5%", left: "65%", transform: "translateY(-50%)" }}
            >
              {formData.county}
            </div>
          )}

          {/* Attendance Reason Checkboxes */}
          {formData.attendanceReason === "court_order" && (
            <div className="absolute text-red-700 font-bold text-sm" style={{ top: "46.8%", left: "49%" }}>
              X
            </div>
          )}
          {formData.attendanceReason === "volunteer" && (
            <div className="absolute text-red-700 font-bold text-sm" style={{ top: "46.8%", left: "59.5%" }}>
              X
            </div>
          )}
          {formData.attendanceReason === "ticket" && (
            <div className="absolute text-red-700 font-bold text-sm" style={{ top: "46.8%", left: "75.2%" }}>
              X
            </div>
          )}

          {/* First Name */}
          {formData.firstName && (
            <div
              className="absolute text-black font-bold text-[10px]"
              style={{ top: "58.8%", left: "16.5%", transform: "translateY(-50%)" }}
            >
              {formData.firstName.toUpperCase()}
            </div>
          )}

          {/* Middle Initial */}
          {formData.middleInitial && (
            <div
              className="absolute text-black font-bold text-[10px]"
              style={{ top: "58.8%", left: "32.2%", transform: "translateY(-50%)" }}
            >
              {formData.middleInitial.toUpperCase()}
            </div>
          )}

          {/* Last Name */}
          {formData.lastName && (
            <div
              className="absolute text-black font-bold text-[10px]"
              style={{ top: "58.8%", left: "39.2%", transform: "translateY(-50%)" }}
            >
              {formData.lastName.toUpperCase()}
            </div>
          )}

          {/* License Number */}
          {formData.licenseNumber && (
            <div
              className="absolute text-black text-[10px]"
              style={{ top: "71%", left: "19.5%", transform: "translateY(-50%)" }}
            >
              {formData.licenseNumber}
            </div>
          )}

          {/* Completion Date */}
          {formData.completionDate && (
            <div
              className="absolute text-black text-[10px]"
              style={{ top: "71%", left: "45.8%", transform: "translateY(-50%)" }}
            >
              {formData.completionDate}
            </div>
          )}

          {/* Instructor's Signature */}
          {formData.instructorSignatureImage ? (
            <div
              className="absolute"
              style={{
                top: "82%",
                left: "18%",
                transform: "translateY(-50%)",
                maxWidth: "150px",
                maxHeight: "40px"
              }}
            >
              <img
                src={formData.instructorSignatureImage}
                alt="Instructor signature"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : formData.instructorSignature && (
            <div
              className="absolute text-black text-[10px]"
              style={{ top: "82%", left: "18%", transform: "translateY(-50%)" }}
            >
              {formData.instructorSignature}
            </div>
          )}

          {/* Instructor's School Name */}
          {formData.instructorSchoolName && (
            <div
              className="absolute text-black text-[10px]"
              style={{ top: "82%", left: "52%", transform: "translateY(-50%)" }}
            >
              {formData.instructorSchoolName}
            </div>
          )}
        </div>
      </div>
    );
  }
);

CertificatePreview.displayName = "CertificatePreview";
