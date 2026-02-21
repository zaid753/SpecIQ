import React from "react";
import { motion } from "motion/react";
import { Calendar, Building2, ArrowRight, Clock } from "lucide-react";
import { Project } from "../../types";
import { useNavigate } from "react-router-dom";

interface ProjectCardProps {
  project: Project;
  key?: string | number;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(date);
  };

  const formatRelativeTime = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all group"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
          <Building2 className="text-indigo-600 dark:text-indigo-400 w-6 h-6" />
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
          <Clock className="w-3 h-3" />
          {formatRelativeTime(project.updatedAt)}
        </div>
      </div>

      <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {project.name}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-2">
        {project.description}
      </p>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Building2 className="w-4 h-4" />
          <span className="font-medium">{project.organization}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Calendar className="w-4 h-4" />
          <span>Started {formatDate(project.startDate)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(project.tags || []).slice(0, 3).map((tag, idx) => (
          <span key={idx} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-md uppercase tracking-wider">
            {tag}
          </span>
        ))}
        {(project.tags?.length || 0) > 3 && (
          <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-md uppercase tracking-wider">
            +{(project.tags?.length || 0) - 3}
          </span>
        )}
      </div>

      <button 
        onClick={() => navigate(`/dashboard/project/${project.id}`)}
        className="w-full py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-bold hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 group/btn"
      >
        Open Workspace
        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
      </button>
    </motion.div>
  );
}
