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
    <SidebarProvider className="min-h-screen" /*  is fine if you want */>
      <AppSidebar />
      <SidebarInset>
        <SidebarTrigger className="mt-4" />
        <div>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
