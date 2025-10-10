"use client";

import { useParams } from "next/navigation";
import SeoPage from "@/components/seo/SeoPage";

export default function ClassSeoPage() {
  const params = useParams();
  const classId = params.classId as string;

  return (
    <SeoPage
      entityType="DrivingClass"
      entityId={classId}
      apiEndpoint={`/api/classes/${classId}`}
      backUrl={`/classes/${classId}`}
      entityLabel="Class"
    />
  );
}
