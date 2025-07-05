import LeftSideBar from "@/components/layout/LeftSideBar";
import TopBar from "@/components/layout/TopBar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute>
      <div className="flex max-lg:flex-col text-grey-1">
        <LeftSideBar />
        <TopBar />
        <div className="flex-1">{children}</div>
      </div>
    </ProtectedRoute>
  );
}
