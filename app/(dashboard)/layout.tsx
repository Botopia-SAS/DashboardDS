import LeftSideBar from "@/components/layout/LeftSideBar";
import TopBar from "@/components/layout/TopBar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import GuideButton from "@/components/ui/GuideButton";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute>
      <div className="flex text-grey-1 min-h-screen">
        {/* Desktop Sidebar */}
        <LeftSideBar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col w-full overflow-x-hidden">
          {/* Mobile TopBar */}
          <TopBar />
          
          {/* Page Content */}
          <div className="flex-1 p-4 lg:p-6 pt-4 lg:pt-6">
            {children}
          </div>
        </div>

        {/* Floating Guide Button */}
        <GuideButton />
      </div>
    </ProtectedRoute>
  );
}
