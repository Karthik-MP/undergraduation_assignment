"use client";
import "@/components/ui/sidebar.css";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  Sidebar, // <- add this
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
// (optional) import a Separator if you have one:
// import { Separator } from "@/components/ui/separator";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100">
        <div className="animate-pulse text-indigo-700 font-semibold">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider /* className="min-h-screen" is fine if you want */>
      <AppSidebar />

      <SidebarInset>
        <header className="sticky z-20 flex h-14 items-center gap-2 border-b bg-white/70 backdrop-blur px-4">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-sm font-medium text-gray-600">Dashboard</h1>
        </header>

        <div className="p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
