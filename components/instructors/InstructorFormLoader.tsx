import React from "react";

const InstructorFormLoader = () => (
  <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded shadow-lg flex flex-col items-center">
      <span
        className="loader mb-2"
        style={{
          width: 32,
          height: 32,
          border: "4px solid #ccc",
          borderTop: "4px solid #3498db",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          display: "inline-block",
        }}
      />
      <span className="text-lg font-semibold">Loading schedule...</span>
    </div>
  </div>
);

export default InstructorFormLoader;
