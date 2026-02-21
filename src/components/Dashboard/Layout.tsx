import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import OnboardingModal from "./OnboardingModal";
import { useAuth } from "../../contexts/AuthContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
      {!profile?.onboarded && <OnboardingModal />}
    </div>
  );
}
