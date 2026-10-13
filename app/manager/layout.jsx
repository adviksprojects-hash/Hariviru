import ManagerSidebar from "@/components/Navigation/ManagerSidebar";

export default function ManagerLayout({ children }) {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 dark:bg-gray-950">
      <ManagerSidebar />
      <div className="flex-1 min-w-0 overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
