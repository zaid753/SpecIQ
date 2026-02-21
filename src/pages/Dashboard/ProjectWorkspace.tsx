import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutDashboard, 
  Database, 
  Sparkles, 
  MessageSquare, 
  FileText, 
  ChevronLeft,
  Calendar,
  Building2,
  Clock,
  Tag as TagIcon
} from "lucide-react";
import { db } from "../../lib/firebase";
import { ref, get, onValue, off } from "firebase/database";
import { Project } from "../../types";
import GmailConnector from "../../components/Dashboard/GmailConnector";
import FileStatusList from "../../components/Dashboard/FileStatusList";
import FileUploader from "../../components/Dashboard/FileUploader";
import EmailList from "../../components/Dashboard/EmailList";
import RequirementIntelligenceEngine from "../../components/Dashboard/RequirementIntelligenceEngine";
import InsightsView from "../../components/Dashboard/InsightsView";

export default function ProjectWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function fetchProject() {
      if (!id) return;
      try {
        const projectRef = ref(db, `projects/${id}`);
        const snapshot = await get(projectRef);
        if (snapshot.exists()) {
          setProject({ id: snapshot.key, ...snapshot.val() } as Project);
        } else {
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProject();

    // Listen for updates (like gmailConnected)
    const projectRef = ref(db, `projects/${id}`);
    const unsubscribe = onValue(projectRef, (snapshot) => {
      if (snapshot.exists()) {
        setProject({ id: snapshot.key, ...snapshot.val() } as Project);
      }
    });

    return () => unsubscribe();
  }, [id, navigate]);

  const tabs = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "data", label: "Data Sources", icon: <Database className="w-4 h-4" /> },
    { id: "insights", label: "Insights", icon: <Sparkles className="w-4 h-4" /> },
    { id: "discussion", label: "AI Discussion", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "documents", label: "Documents", icon: <FileText className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="max-w-7xl mx-auto">
      <RequirementIntelligenceEngine projectId={id!} />
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-4 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white">
                {project.name}
              </h1>
              <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full uppercase tracking-wider">
                Active
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span className="font-medium">{project.organization}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Started {project.startDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <TagIcon className="w-4 h-4" />
                <div className="flex gap-1">
                  {(project.tags || []).map((tag, idx) => (
                    <span key={idx} className="text-xs">{tag}{idx < (project.tags?.length || 0) - 1 ? "," : ""}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative whitespace-nowrap ${
              activeTab === tab.id 
                ? "text-indigo-600 dark:text-indigo-400" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="min-h-[400px]"
        >
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
                  <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-4">Project Description</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {project.description}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center">
                        <Database className="text-emerald-600 w-5 h-5" />
                      </div>
                      <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Data Sources</div>
                    </div>
                    <div className="text-2xl font-display font-bold dark:text-white">
                      {project.gmailConnected ? "1 Connected" : "0 Connected"}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center">
                        <Sparkles className="text-indigo-600 w-5 h-5" />
                      </div>
                      <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Insights</div>
                    </div>
                    <div className="text-2xl font-display font-bold dark:text-white">0 Generated</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
                  <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-6">Recent Activity</h3>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-900 dark:text-white font-medium">Project Created</p>
                        <p className="text-xs text-slate-500">Just now</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "data" && (
            <div className="space-y-16">
              <FileUploader projectId={id!} />
              <GmailConnector projectId={id!} showList={false} />
              <FileStatusList projectId={id!} />
              <EmailList projectId={id!} />
            </div>
          )}

          {activeTab === "insights" && (
            <InsightsView projectId={id!} />
          )}

          {activeTab !== "overview" && activeTab !== "data" && activeTab !== "insights" && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 p-20 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  {tabs.find(t => t.id === activeTab)?.icon}
                </div>
                <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-4">
                  {tabs.find(t => t.id === activeTab)?.label} Coming Soon
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                  We're building the infrastructure to connect your data sources and generate intelligent insights. Stay tuned!
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
