/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { Form } from "@/components/ui/form";
import { Separator } from "../ui/separator";
import { Button } from "@/components/ui/button";
import InstructorBasicInfo from "./InstructorBasicInfo";
import { useInstructorForm } from "./useInstructorForm";
import { InstructorData } from "./types";
import { toast } from "react-hot-toast";

const InstructorForm = ({ initialData }: { initialData?: InstructorData }) => {
  const {
    form,
    loading,
    savingChanges,
    hasChanges,
    generatePassword,
    onSubmit,
    router,
  } = useInstructorForm(initialData);

  const handleSubmit = async (values: InstructorData) => {
    // Use the professional onSubmit from the hook
    await onSubmit(values);
  };

  return (
    <div className="p-10">
      <p className="text-heading2-bold">
        {initialData ? "Edit Instructor" : "Create Instructor"}
      </p>
      <Separator className="bg-grey-1 mt-4 mb-7" />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-8"
          autoComplete="off"
        >
          {/* Basic Info Section */}
          <InstructorBasicInfo form={form} generatePassword={generatePassword} />
          
          {/* Form Actions */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white"
            >
              {savingChanges 
                ? "Saving..." 
                : loading 
                ? "Processing..."
                : initialData 
                ? "Save Changes" 
                : "Create Instructor"
              }
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                router.push("/instructors");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default InstructorForm;
