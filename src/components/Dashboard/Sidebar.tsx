import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  LayoutDashboard, 
  FolderKanban, 
  Database, 
  Cpu, 
  FileText, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { auth } from "../../lib/firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();

  const navItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: t("dashboard"), path: "/dashboard" },
    { icon: <FolderKanban className="w-5 h-5" />, label: t("projects"), path: "/dashboard" },
    { icon: <Database className="w-5 h-5" />, label: t("dataSources"), disabled: true },
    { icon: <Cpu className="w-5 h-5" />, label: t("aiWorkspace"), disabled: true },
    { icon: <FileText className="w-5 h-5" />, label: t("documents"), disabled: true },
    { icon: <Settings className="w-5 h-5" />, label: t("settings"), path: "/dashboard/settings" },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const currentPath = window.location.pathname;

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      className="h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col relative z-40 transition-colors duration-300"
    >
      <div className="p-6 flex items-center gap-3">
        <div 
          onClick={() => navigate("/")}
          className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20 cursor-pointer"
        >
          <Zap className="text-white w-6 h-6" />
        </div>
        {!isCollapsed && (
          <span className="text-2xl font-display font-bold dark:text-white cursor-pointer" onClick={() => navigate("/")}>SpecIq</span>
        )}
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item, idx) => {
          const isActive = currentPath === item.path;
          return (
            <button
              key={idx}
              disabled={item.disabled}
              onClick={() => item.path && navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative text-left",
                isActive 
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800",
                item.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className={cn(
                "flex-shrink-0",
                isActive ? "text-indigo-600 dark:text-indigo-400" : "group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
              )}>
                {item.icon}
              </div>
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
              {item.disabled && !isCollapsed && (
                <span className="ml-auto text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase tracking-wider">Soon</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="font-medium">{t("logout")}</span>}
        </button>
      </div>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </motion.aside>
  );
}
