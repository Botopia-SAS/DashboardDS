import Certificate from "@/components/ticket/Certificate";

export default function Page() {
  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center bg-gray-800 text-white px-5 py-3 rounded-lg shadow-md">
          <h1 className="text-xl font-semibold">Tickets</h1>
        </div>
      </div>
      <div className="p-6">
        <Certificate
          name="Santiago Aristizabal"
          birthDate="18/09/2003"
          certificateDate="17/03/2025"
        />
      </div>
    </>
  );
}
