"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import OnlineCourseForm from "@/components/online-courses/OnlineCourseForm";
import Loader from "@/components/custom ui/Loader";
import { OnlineCourseType } from "@/components/online-courses/OnlineCourseForm";

interface OnlineCourseData extends OnlineCourseType {
  _id: string;
}

const EditOnlineCoursePage = () => {
  const params = useParams();
  const [onlineCourse, setOnlineCourse] = useState<OnlineCourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onlineCourseId = params['online-courseId'] as string;

  useEffect(() => {
    if (!onlineCourseId) return;

    const fetchOnlineCourse = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/online-courses/${onlineCourseId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch online course');
        }
        
        const data = await response.json();
        setOnlineCourse(data);
      } catch (error) {
        console.error('Error fetching online course:', error);
        setError('Failed to load online course');
      } finally {
        setLoading(false);
      }
    };

    fetchOnlineCourse();
  }, [onlineCourseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return <OnlineCourseForm initialData={onlineCourse} />;
};

export default EditOnlineCoursePage;