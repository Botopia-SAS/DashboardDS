"use client";

import { useParams } from "next/navigation";
import SeoPage from "@/components/seo/SeoPage";

export default function OnlineCourseSeoPage() {
  const params = useParams();
  const courseId = params["online-courseId"] as string;

  return (
    <SeoPage
      entityType="OnlineCourse"
      entityId={courseId}
      apiEndpoint={`/api/online-courses/${courseId}`}
      backUrl={`/online-courses/${courseId}`}
      entityLabel="Course"
    />
  );
}
