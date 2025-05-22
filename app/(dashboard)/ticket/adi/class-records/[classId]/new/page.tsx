"use client";
import NewStudentForm from "@/components/ticket/newStudentForm";
import { Button } from "@headlessui/react";
import { ArrowLeftIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;

  const navigate = () => {
    router.back();
  };

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center bg-gray-800 text-white px-5 py-3 rounded-lg shadow-md">
          <h1 className="text-xl font-semibold">Tickets</h1>
          <Button onClick={navigate} className="hover:scale-110">
            <ArrowLeftIcon size={16} />
          </Button>
        </div>
      </div>
      <div className="p-6">
        <NewStudentForm classId={classId}/>
      </div>
    </>
  );
}
