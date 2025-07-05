/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { Form } from "@/components/ui/form";
import { Separator } from "../ui/separator";
import { Button } from "@/components/ui/button";
import InstructorBasicInfo from "./InstructorBasicInfo";
import InstructorSchedule from "./InstructorSchedule";
import ScheduleModal from "./ScheduleModal";
import EditRecurringModal from "./EditRecurringModal";
import InstructorFormLoader from "./InstructorFormLoader";
import { useInstructorForm } from "./useInstructorForm";
import { InstructorData } from "./types";
import { toast } from "react-hot-toast";
import { PendingChangesIndicator } from "./PendingChangesIndicator";

const InstructorForm = ({ initialData }: { initialData?: InstructorData }) => {
  const {
    form,
    loading,
    loadingSchedule,
    savingChanges,
    hasChanges,
    recurrenceOptions,
    recurrenceEnd,
    setRecurrenceEnd,
    calendarEvents,
    isModalOpen,
    setIsModalOpen,
    currentSlot,
    setCurrentSlot,
    handleSaveSlot,
    handleUpdateSlot,
    handleDeleteSlot,
    handleDateSelect,
    handleEventClick,
    slotType,
    setSlotType,
    allUsers,
    selectedStudent,
    setSelectedStudent,
    selectedStudents,
    setSelectedStudents,
    availableSpots,
    setAvailableSpots,
    locations,
    editModalOpen,
    setEditModalOpen,
    setEditAll,
    generatePassword,
    onSubmit,
    clearScheduleDraft,
    discardAllChanges,
    router,
    visualFeedback,
  } = useInstructorForm(initialData);

  const handleSubmit = async (values: InstructorData) => {
    // Use the professional onSubmit from the hook
    await onSubmit(values);
  };

  return (
    <div className="p-10">
      {loadingSchedule && <InstructorFormLoader />}
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
          {/* Schedule Calendar Section */}
          <InstructorSchedule
            calendarEvents={calendarEvents}
            handleDateSelect={handleDateSelect}
            handleEventClick={handleEventClick}
          />
          {/* Schedule Modal for slot configuration */}
          <ScheduleModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            currentSlot={currentSlot}
            setCurrentSlot={setCurrentSlot}
            handleSaveSlot={handleSaveSlot}
            handleUpdateSlot={handleUpdateSlot}
            handleDeleteSlot={handleDeleteSlot}
            recurrenceOptions={recurrenceOptions}
            recurrenceEnd={recurrenceEnd}
            setRecurrenceEnd={setRecurrenceEnd}
            slotType={slotType}
            setSlotType={setSlotType}
            allUsers={allUsers}
            selectedStudent={selectedStudent}
            setSelectedStudent={setSelectedStudent}
            selectedStudents={selectedStudents}
            setSelectedStudents={setSelectedStudents}
            availableSpots={availableSpots}
            setAvailableSpots={setAvailableSpots}
            locations={locations}
          />
          {/* Edit Recurring Modal */}
          <EditRecurringModal
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            setIsModalOpen={setIsModalOpen}
            setEditAll={setEditAll}
          />
          
          {/* Pending Changes Indicator */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <PendingChangesIndicator
              pendingChanges={visualFeedback.getPendingChangesSummary()}
              hasChanges={hasChanges}
              savingChanges={savingChanges}
            />
          </div>
          
          {/* Form Actions */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={loading || !hasChanges}
              className="bg-blue-600 text-white"
            >
              {savingChanges 
                ? "Updating Calendar..." 
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
                discardAllChanges();
                router.push("/instructors");
              }}
            >
              Discard
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default InstructorForm;
