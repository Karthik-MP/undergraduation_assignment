"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { Home, Users, Mail, BarChart3, Settings, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/services/firebase";
import { useAuth } from "@/contexts/AuthContext"; // <- adjust path to your provider
import Link from "next/link";
import { useSidebar } from "@/components/ui/sidebar";
import Image from "next/image";
import logo from "@/public/logo.png";
export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile; // rail mode

  const nav = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/dashboard/students", label: "Students", icon: Users },
    { href: "/dashboard/communications", label: "Comms", icon: Mail },
    { href: "/dashboard/insights", label: "Insights", icon: BarChart3 },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  async function handleSignOut() {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch {
      // no-op; surface via toast if you already use one
    }
  }

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="sidebar border-r bg-white/80 backdrop-blur-md"
    >
      <SidebarHeader className="px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo always visible */}
          <Link href="/dashboard" className="flex items-center gap-2">
            {isCollapsed && (
              <Image
                src={logo}
                alt="Logo"
                width={28}
                height={28}
                className="shrink-0 rounded"
              />
            )}
            {/* Brand only when expanded */}
            {!isCollapsed && (
              <div className="leading-tight">
                <div className="text-indigo-700 font-extrabold tracking-tight text-xl">
                  Undergraduation
                </div>
                <div className="text-xs text-gray-500">Admin Dashboard</div>
              </div>
            )}
          </Link>

          <SidebarTrigger className="md:hidden" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400">Main</SidebarGroupLabel>
          <SidebarMenu>
            {nav.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname?.startsWith(item.href);
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    className={`rounded-lg ${
                      active ? "bg-indigo-50 text-indigo-700" : ""
                    }`}
                  >
                    <Link href={item.href} className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t bg-white/60">
        {/* Expanded: show user info + full button */}
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.displayName || user?.email || "User"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || ""}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1 rounded-lg mx-2 px-2 py-1 text-xs bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        ) : (
          // Collapsed: just an icon button (with title for a11y)
          <div className="flex items-center justify-center py-2">
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
