import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Users, 
  Calendar, 
  ShieldAlert, 
  CheckCircle2, 
  Lightbulb,
  Search,
  Filter,
  Loader2,
  ChevronRight
} from "lucide-react";
import { motion } from "motion/react";
import { db } from "../../lib/firebase";
import { ref, onValue, off } from "firebase/database";

interface InsightsViewProps {
  projectId: string;
}

export default function InsightsView({ projectId }: InsightsViewProps) {
  const [aggregated, setAggregated] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    if (!projectId) return;

    const aggRef = ref(db, `projects/${projectId}/aggregatedInsights`);
    const unsubscribe = onValue(aggRef, (snapshot) => {
      setAggregated(snapshot.val());
      setLoading(false);
    });

    return () => off(aggRef);
  }, [projectId]);

  const categories = [
    { id: "all", label: "All Insights", icon: <Sparkles className="w-4 h-4" /> },
    { id: "functional", label: "Functional", icon: <CheckCircle2 className="w-4 h-4" />, key: "allFunctionalRequirements" },
    { id: "nonFunctional", label: "Non-Functional", icon: <ShieldAlert className="w-4 h-4" />, key: "allNonFunctionalRequirements" },
    { id: "stakeholders", label: "Stakeholders", icon: <Users className="w-4 h-4" />, key: "allStakeholders" },
    { id: "timeline", label: "Timeline", icon: <Calendar className="w-4 h-4" />, key: "allDeadlines" },
    { id: "decisions", label: "Decisions", icon: <CheckCircle2 className="w-4 h-4" />, key: "allDecisions" },
    { id: "risks", label: "Risks", icon: <ShieldAlert className="w-4 h-4" />, key: "allRisks" },
    { id: "assumptions", label: "Assumptions", icon: <Lightbulb className="w-4 h-4" />, key: "allAssumptions" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white">Analyzing Project Data...</h3>
        <p className="text-slate-500 dark:text-slate-400">Our AI is extracting requirements and insights from your sources.</p>
      </div>
    );
  }

  if (!aggregated) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 p-20 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Sparkles className="text-indigo-600 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-4">
            No Insights Yet
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Upload files or connect Gmail to start generating intelligent requirement insights.
          </p>
        </div>
      </div>
    );
  }

  const renderSection = (title: string, items: string[], icon: React.ReactNode) => {
    if (!items || items.length === 0) return null;
    
    const filtered = items.filter(item => 
      item.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filtered.length === 0 && searchTerm) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400">
            {icon}
          </div>
          <h4 className="text-lg font-display font-bold text-slate-900 dark:text-white">{title}</h4>
          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs rounded-full">
            {filtered.length}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-start gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
            >
              <div className="mt-1 flex-shrink-0">
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{item}</p>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search requirements, risks, decisions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-2 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-indigo-300"
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Insights Grid */}
      <div className="space-y-12">
        {(activeCategory === "all" || activeCategory === "functional") && 
          renderSection("Functional Requirements", aggregated.allFunctionalRequirements, <CheckCircle2 className="w-4 h-4" />)}
        
        {(activeCategory === "all" || activeCategory === "nonFunctional") && 
          renderSection("Non-Functional Requirements", aggregated.allNonFunctionalRequirements, <ShieldAlert className="w-4 h-4" />)}
        
        {(activeCategory === "all" || activeCategory === "stakeholders") && 
          renderSection("Stakeholders", aggregated.allStakeholders, <Users className="w-4 h-4" />)}
        
        {(activeCategory === "all" || activeCategory === "timeline") && 
          renderSection("Timeline & Deadlines", aggregated.allDeadlines, <Calendar className="w-4 h-4" />)}
        
        {(activeCategory === "all" || activeCategory === "decisions") && 
          renderSection("Decisions", aggregated.allDecisions, <CheckCircle2 className="w-4 h-4" />)}
        
        {(activeCategory === "all" || activeCategory === "risks") && 
          renderSection("Risks & Concerns", aggregated.allRisks, <ShieldAlert className="w-4 h-4" />)}
        
        {(activeCategory === "all" || activeCategory === "assumptions") && 
          renderSection("Assumptions", aggregated.allAssumptions, <Lightbulb className="w-4 h-4" />)}
      </div>
    </div>
  );
}
