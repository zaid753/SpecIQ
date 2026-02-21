import React, { useState, useEffect } from "react";
import { Mail, RefreshCw, LogOut, CheckCircle2, AlertCircle, Loader2, Play } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../lib/firebase";
import { ref, onValue, off } from "firebase/database";
import { GmailEmail } from "../../types";

interface GmailConnectorProps {
  projectId: string;
  showList?: boolean;
}

export default function GmailConnector({ projectId, showList = true }: GmailConnectorProps) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [emails, setEmails] = useState<GmailEmail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    const projectRef = ref(db, `projects/${projectId}/gmailConnected`);
    const emailsRef = ref(db, `projects/${projectId}/emails`);

    const unsubscribeConnected = onValue(projectRef, (snapshot) => {
      setIsConnected(snapshot.val() || false);
      setLoading(false);
    });

    const unsubscribeEmails = onValue(emailsRef, (snapshot) => {
      if (snapshot.exists()) {
        const emailData = snapshot.val();
        const emailList = Object.values(emailData) as GmailEmail[];
        setEmails(emailList.sort((a, b) => b.timestamp - a.timestamp));
      } else {
        setEmails([]);
      }
    });

    return () => {
      off(projectRef);
      off(emailsRef);
    };
  }, [projectId]);

  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      const response = await fetch(`/api/auth/url?projectId=${projectId}&userId=${user?.uid}`);
      
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        if (!response.ok) throw new Error(text || `Server error: ${response.status}`);
        data = { url: text }; // Fallback if somehow URL is returned as text
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to get auth URL");
      }
      const { url } = data;
      
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const authWindow = window.open(
        url,
        'gmail_oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!authWindow) {
        alert("Please allow popups to connect your Gmail account.");
        setIsConnecting(false);
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        // Validate origin
        const origin = event.origin;
        if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
          return;
        }

        if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.projectId === projectId) {
          setIsConnected(true);
          setIsConnecting(false);
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);
      
      // Monitor window closure
      const checkWindow = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkWindow);
          setIsConnecting(false);
          window.removeEventListener('message', handleMessage);
        }
      }, 1000);

    } catch (error: any) {
      console.error("Failed to connect Gmail:", error);
      alert(error.message || "Failed to connect Gmail. Please check server configuration.");
      setIsConnecting(false);
    }
  };

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const response = await fetch('/api/gmail/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, userId: user?.uid })
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Sync failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Synced ${data.count} emails`);
      
      // Automatically trigger processing after sync
      handleProcess();
    } catch (error: any) {
      console.error("Sync error:", error);
      alert(error.message || "Failed to sync emails.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleProcess = async () => {
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
      alert(error.message || "Failed to process emails.");
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Gmail? This will not delete already synced emails.")) return;
    try {
      const response = await fetch('/api/gmail/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, userId: user?.uid })
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Disconnect failed: ${response.status}`);
      }
      setIsConnected(false);
    } catch (error: any) {
      console.error("Disconnect error:", error);
      alert(error.message || "Failed to disconnect Gmail.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Connection Status Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              isConnected 
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" 
                : "bg-slate-50 dark:bg-slate-800 text-slate-400"
            }`}>
              <Mail className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-1">
                Gmail Integration
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {isConnected 
                  ? "Your Gmail account is connected and syncing." 
                  : "Connect your Gmail to automatically import project-related emails."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isConnected ? (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {isConnecting ? "Connecting..." : "Connect Gmail"}
              </button>
            ) : (
              <>
                {emails.some(e => e.processingStatus === 'pending') && (
                  <button
                    onClick={handleProcess}
                    className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 font-bold rounded-xl transition-all flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Process Pending
                  </button>
                )}
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="px-6 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {isSyncing ? "Syncing..." : "Sync Emails"}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                  title="Disconnect Gmail"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Email List */}
      {isConnected && showList && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Synced Emails
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs rounded-full">
                {emails.length}
              </span>
            </h4>
          </div>

          {emails.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Mail className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-slate-500 dark:text-slate-400">No emails synced yet. Click "Sync Emails" to start.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {emails.map((email) => (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h5 className="text-slate-900 dark:text-white font-bold truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {email.subject}
                      </h5>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        From: {email.sender}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium text-slate-400">
                        {new Date(email.timestamp).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-1 mt-1 justify-end">
                        {email.processingStatus === 'completed' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        ) : email.processingStatus === 'failed' ? (
                          <AlertCircle className="w-3 h-3 text-red-500" />
                        ) : (
                          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {email.processingStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {email.snippet}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
