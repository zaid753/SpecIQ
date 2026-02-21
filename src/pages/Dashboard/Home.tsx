import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { FolderPlus, Sparkles, LayoutGrid, Plus } from "lucide-react";
import { db } from "../../lib/firebase";
import { ref, query, orderByChild, equalTo, onValue } from "firebase/database";
import { Project } from "../../types";
import ProjectCard from "../../components/Dashboard/ProjectCard";
import CreateProjectModal from "../../components/Dashboard/CreateProjectModal";

export default function DashboardHome() {
  const { profile, user } = useAuth();
  const { t } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const userName = profile?.fullName || user?.email?.split("@")[0] || "User";

  useEffect(() => {
    if (!user) return;

    const projectsRef = ref(db, "projects");
    const userProjectsQuery = query(
      projectsRef,
      orderByChild("userId"),
      equalTo(user.uid)
    );

    const unsubscribe = onValue(userProjectsQuery, (snapshot) => {
      const projectsData: Project[] = [];
      snapshot.forEach((childSnapshot) => {
        projectsData.push({
          id: childSnapshot.key as string,
          ...childSnapshot.val()
        });
      });
      // Sort by updatedAt descending manually since RTDB query only supports one sort
      projectsData.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setProjects(projectsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching projects:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const stats = [
    { icon: <LayoutGrid className="text-indigo-600" />, label: "Total Projects", value: projects.length.toString() },
    { icon: <Sparkles className="text-emerald-600" />, label: "AI Extractions", value: "0" },
    { icon: <FolderPlus className="text-orange-600" />, label: "Draft Specs", value: "0" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-2">
            {t("welcome")}, {userName}! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            Here's what's happening with your projects today.
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Project
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                {stat.icon}
              </div>
              <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
            </div>
            <div className="text-3xl font-display font-bold dark:text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project: Project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 p-20 text-center"
        >
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <FolderPlus className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-4">
              {t("emptyProjects")}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              SpecIq helps you turn messy conversations into structured business requirements. Create a project to get started.
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 flex items-center gap-2 mx-auto"
            >
              <FolderPlus className="w-5 h-5" />
              {t("getStarted")}
            </button>
          </div>
        </motion.div>
      )}

      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
