/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { Form } from "@/components/ui/form";
import { Separator } from "../ui/separator";
import { Button } from "@/components/ui/button";
import InstructorBasicInfo from "./InstructorBasicInfo";
import { useInstructorForm } from "./useInstructorForm";
import { InstructorData } from "./types";
import { toast } from "react-hot-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const InstructorForm = ({ initialData }: { initialData?: InstructorData }) => {
  const {
    form,
    loading,
    savingChanges,
    hasChanges,
    generatePassword,
    onSubmit,
    router,
    showTicketClassWarning,
    setShowTicketClassWarning,
    confirmTicketClassDeletion,
    cancelTicketClassDeletion,
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

      {/* Ticket Class Deactivation Warning Modal */}
      <AlertDialog open={showTicketClassWarning} onOpenChange={setShowTicketClassWarning}>
        <AlertDialogContent className="bg-white text-black border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-black">⚠️ Warning: Ticket Class Deactivation</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700">
              You are about to deactivate the "Ticket Class" capability for this instructor. 
              This action will automatically delete ALL ticket classes associated with this instructor.
              <br /><br />
              <strong>This action cannot be undone.</strong> All scheduled ticket classes for this instructor will be permanently removed.
              <br /><br />
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelTicketClassDeletion} className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmTicketClassDeletion}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, Delete All Ticket Classes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InstructorForm;
