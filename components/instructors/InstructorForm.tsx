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

const InstructorForm = ({ initialData }: { initialData?: InstructorData }) => {
  const {
    form,
    loading,
    loadingSchedule,
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
    locations,
    editModalOpen,
    setEditModalOpen,
    setEditAll,
    generatePassword,
    onSubmit,
    clearScheduleDraft,
    discardAllChanges,
    router,
  } = useInstructorForm(initialData);

  return (
    <div className="p-10">
      {loadingSchedule && <InstructorFormLoader />}
      <p className="text-heading2-bold">
        {initialData ? "Edit Instructor" : "Create Instructor"}
      </p>
      <Separator className="bg-grey-1 mt-4 mb-7" />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
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
            locations={locations}
          />
          {/* Edit Recurring Modal */}
          <EditRecurringModal
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            setIsModalOpen={setIsModalOpen}
            setEditAll={setEditAll}
          />
          {/* Form Actions */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white"
            >
              {initialData ? "Save Changes" : "Create Instructor"}
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
