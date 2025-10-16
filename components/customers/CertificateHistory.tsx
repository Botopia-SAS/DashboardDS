"use client";

import { useEffect, useState } from "react";

interface CertificateHistoryProps {
  customerId: string;
}

interface Certificate {
  _id: string;
  certificateNumber: string;
  className: string;
  classDate: string;
  issueDate?: string;
  duration?: string;
  status: string;
  locationName?: string;
  classId?: string;
}

const CertificateHistory = ({ customerId }: CertificateHistoryProps) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("");
  const [certificateNumberFilter, setCertificateNumberFilter] = useState("");

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const res = await fetch(`/api/customers/${customerId}/certificates`);
        if (!res.ok) throw new Error("Failed to fetch certificates");
        const data = await res.json();
        setCertificates(data);
        setFilteredCertificates(data);
      } catch (err) {
        console.error("Error fetching certificates:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [customerId]);

  useEffect(() => {
    let filtered = certificates;

    if (dateFilter) {
      filtered = filtered.filter((cert) => {
        const date = new Date(cert.classDate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const certDate = `${year}-${month}-${day}`;
        return certDate === dateFilter;
      });
    }

    if (certificateNumberFilter) {
      filtered = filtered.filter((cert) => {
        return cert.certificateNumber.toLowerCase().includes(certificateNumberFilter.toLowerCase());
      });
    }

    setFilteredCertificates(filtered);
  }, [dateFilter, certificateNumberFilter, certificates]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Traffic School Certificates
        </h3>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Date
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Certificate Number
            </label>
            <input
              type="text"
              value={certificateNumberFilter}
              onChange={(e) => setCertificateNumberFilter(e.target.value)}
              placeholder="Enter certificate number..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {(dateFilter || certificateNumberFilter) && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setDateFilter("");
                  setCertificateNumberFilter("");
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {certificates.length === 0 ? (
          <div className="p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No certificates
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              This customer has not received any Traffic School certificates yet.
            </p>
          </div>
        ) : filteredCertificates.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">
              No certificates match the selected filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certificate Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCertificates.map((cert) => (
                  <tr key={cert._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {cert.certificateNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cert.className}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(cert.classDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cert.duration || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-md border-2 bg-transparent border-green-500 text-green-600">
                        {cert.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateHistory;
