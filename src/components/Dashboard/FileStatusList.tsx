import React, { useState, useEffect } from "react";
import { FileText, Loader2, CheckCircle2, AlertCircle, Clock, Play } from "lucide-react";
import { motion } from "motion/react";
import { db } from "../../lib/firebase";
import { ref, onValue, off } from "firebase/database";
import { useAuth } from "../../contexts/AuthContext";

interface FileStatusListProps {
  projectId: string;
}

export default function FileStatusList({ projectId }: FileStatusListProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    const filesRef = ref(db, `projects/${projectId}/files`);
    const unsubscribe = onValue(filesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const fileList = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          ...val
        }));
        setFiles(fileList);
      } else {
        setFiles([]);
      }
      setLoading(false);
    });

    return () => off(filesRef);
  }, [projectId]);

  const handleProcess = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.uid })
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Processing failed: ${response.status}`);
      }
    } catch (error: any) {
      console.error("Processing error:", error);
      alert(error.message || "Failed to process files.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'parsed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'parsing': return <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'parsed': return "Parsed";
      case 'parsing': return "Parsing";
      case 'error': return "Error";
      default: return "Pending";
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
          Uploaded Files
          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs rounded-full">
            {files.length}
          </span>
        </h4>
        
        {files.some(f => f.processingStatus === 'pending') && (
          <button
            onClick={handleProcess}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isProcessing ? "Processing..." : "Process All"}
          </button>
        )}
      </div>

      {files.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">No files uploaded to this project yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {files.map((file) => (
            <div 
              key={file.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{file.name}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">{file.type || 'Unknown Type'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg flex-shrink-0">
                {getStatusIcon(file.processingStatus)}
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {getStatusLabel(file.processingStatus)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
