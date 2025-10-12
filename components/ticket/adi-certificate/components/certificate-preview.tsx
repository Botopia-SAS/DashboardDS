"use client";

import { forwardRef } from "react";
import type { AdiCertificateData } from "../types";
import Image from "next/image";

interface CertificatePreviewProps {
  formData: AdiCertificateData;
}

export const CertificatePreview = forwardRef<
  HTMLDivElement,
  CertificatePreviewProps
>(({ formData }, ref) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-center">Live Preview</h3>
      <div
        ref={ref}
        className="bg-white shadow-sm"
        style={{
          width: "612px",
          minHeight: "auto",
          padding: "35px 25px 25px 25px",
          fontFamily: "Arial, sans-serif",
          boxSizing: "border-box",
        }}
      >
        {/* Header Section */}
        <div className="flex items-start mb-6">
          {/* Logo */}
          <div className="flex-shrink-0 mr-3">
            <Image
              src="/logo.png"
              alt="Logo"
              width={70}
              height={70}
              className="object-contain"
            />
          </div>

          {/* Company Info */}
          <div className="flex-grow">
            <h1 className="text-base font-bold mb-0.5 leading-tight">
              Affordable Driving and
            </h1>
            <h1 className="text-base font-bold mb-1 leading-tight">Traffic School, Inc.</h1>
            <p className="text-xs mb-0.5">3167 Forest Hill Blvd.</p>
            <p className="text-xs mb-0.5">West Palm Beach, FL 33406</p>
            <p className="text-xs">(561) 969-0150 - (561) 330-7007</p>
          </div>

          {/* Course Information Box */}
          <div
            className="flex-shrink-0 p-3 rounded"
            style={{ backgroundColor: "#ccffcc", width: "180px" }}
          >
            <h3 className="text-xs font-bold mb-1.5">COURSE INFORMATION</h3>
            <div className="space-y-0.5 text-xs">
              <div className="flex flex-col">
                <span className="font-bold">Course Date:</span>
                <span className="text-xs">{formatDate(formData.courseDate) || "N/A"}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold">Course Time:</span>
                <span className="text-xs">{formData.courseTime || "N/A"}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold">Course Location:</span>
                <span className="break-words text-xs leading-tight">
                  {formData.courseAddress || "N/A"}
                </span>
              </div>
              <div className="pt-1">
                <span className="font-bold">Class Fee: $100.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Student Information */}
        <div className="mb-3 flex justify-between items-center">
          <div>
            <span className="font-bold text-xs">Dear: </span>
            <span className="font-bold text-xs">
              {formData.firstName}{" "}
              {formData.middleInitial ? `${formData.middleInitial} ` : ""}
              {formData.lastName || "Student Name"}
            </span>
          </div>
          <div>
            <span className="font-bold text-xs">
              Certificate No: {formData.certificateNumber || "N/A"}
            </span>
          </div>
        </div>

        {/* Current Date */}
        <div className="mb-3">
          <p className="text-xs">{currentDate}</p>
        </div>

        {/* Thank you message */}
        <div className="mb-3">
          <p className="text-xs">
            Thank you for choosing Affordable Driving and Traffic School as the
            traffic school of your choice.
          </p>
        </div>

        {/* Important Notice */}
        <div className="mb-3">
          <p className="text-xs font-bold">
            ALL SEATS RESERVED! PAYMENT MUST BE MADE PRIOR TO CLASS DATE!
          </p>
        </div>

        {/* Agreement Title */}
        <div className="mb-2">
          <h2 className="text-xs font-bold">
            AFFORDABLE DRIVING AND TRAFFIC SCHOOL, INC. (ADTS)
          </h2>
          <h3 className="text-xs font-bold">
            12 Hrs ADVANCED DRIVER IMPROVEMENT COURSE AGREEMENT
          </h3>
        </div>

        {/* Agreement Text */}
        <div className="space-y-2 text-[10px] leading-tight mb-6">
          <p>
            This course combines Florida Traffic laws and awareness program
            which will affect your ability to avoid future traffic violations.
          </p>
          <p>
            It is mandatory that you attend class date(s) scheduled. If you
            miss any session(s) scheduled you must re-register and pay a
            $100.00 fee.
          </p>
          <p>
            To cancel or reschedule a class, you will be charged a $100.00 fee
            to reschedule, if not done two days in advance.
          </p>
          <p>
            Classes begin at the times scheduled. Late arrivals will receive NO
            CREDIT. Class breaks are designated for designed time frame. If you
            are late returning you will receive NO CREDIT for attending. Both
            traffic situations require registration and a $100.00 registration
            fee.
          </p>
          <p>Fees are NOT REFUNDABLE and payments implies consent.</p>
          <div className="pt-1">
            <p className="font-bold">
              WARNING! IF YOU HAVE A SUSPENDED LICENSE OR LICENSE THAT WILL BE
              SUSPENDED BY THE STATE OF FLORIDA, YOU SHOULD IMMEDIATELY CONTACT
              THE BUREAU OF DRIVER IMPROVEMENT AT (850) 617-2000 OR 2900
              APALACHEE PKWY, TALLAHASSEE, FL 32399-0575. TO KNOW IF YOU ARE
              ELIGIBLE TO TAKE THIS CLASS. IF YOU HAVE ANY QUESTIONS, PLEASE
              CALL OR VISIT OUR OFFICE. REMEMBER, IMMEDIATELY AFTER COMPLETION
              OF THIS CLASS, YOU MUST GO TO THE LOCAL DMV OFFICE TO GET YOUR
              DRIVER LICENSE REINSTATED AND PAY REINSTATEMENT FEES.
            </p>
          </div>
        </div>

        {/* Signature Section */}
        <div className="flex justify-between items-end pt-4 mt-4">
          <div>
            <div className="border-t border-black w-32 mb-1"></div>
            <p className="text-[10px]">Date</p>
          </div>
          <div>
            <div className="border-t border-black w-40 mb-1"></div>
            <p className="text-[10px]">Student Signature</p>
            <div className="border-t border-black w-40 mb-1 mt-4"></div>
            <p className="text-[10px]">ADTS Officer</p>
          </div>
        </div>
      </div>
    </div>
  );
});

CertificatePreview.displayName = "CertificatePreview";
