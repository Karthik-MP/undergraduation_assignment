"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.displayName || 'User'}!</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Welcome to your dashboard</h2>
          <p className="mt-2 text-gray-600">This is your main dashboard page.</p>
        </div>
        
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Quick Stats</h2>
          <p className="mt-2 text-gray-600">View your activity and progress.</p>
        </div>
        
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          <p className="mt-2 text-gray-600">Check your latest updates.</p>
        </div>
      </div>
    </div>
  );
}