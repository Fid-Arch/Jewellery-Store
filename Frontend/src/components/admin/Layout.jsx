import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar"; // ✅ new Topbar

function Layout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen bg-gray-50 dark:bg-gray-900">
        <Topbar /> {/* ✅ luxury topbar */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

export default Layout;
