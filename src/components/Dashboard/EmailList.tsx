import React, { useState, useEffect } from "react";
import { Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { db } from "../../lib/firebase";
import { ref, onValue, off } from "firebase/database";
import { GmailEmail } from "../../types";

interface EmailListProps {
  projectId: string;
}

export default function EmailList({ projectId }: EmailListProps) {
  const [emails, setEmails] = useState<GmailEmail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    const emailsRef = ref(db, `projects/${projectId}/emails`);
    const unsubscribe = onValue(emailsRef, (snapshot) => {
      if (snapshot.exists()) {
        const emailData = snapshot.val();
        const emailList = Object.values(emailData) as GmailEmail[];
        setEmails(emailList.sort((a, b) => b.timestamp - a.timestamp));
      } else {
        setEmails([]);
      }
      setLoading(false);
    });

    return () => off(emailsRef);
  }, [projectId]);

  if (loading) return null;

  return (
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
          <p className="text-slate-500 dark:text-slate-400">No emails synced yet.</p>
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
                    {email.processingStatus === 'parsed' ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    ) : email.processingStatus === 'error' ? (
                      <AlertCircle className="w-3 h-3 text-red-500" />
                    ) : email.processingStatus === 'parsing' ? (
                      <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />
                    ) : (
                      <div className="w-2 h-2 bg-slate-300 rounded-full" />
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {email.processingStatus || 'pending'}
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
  );
}
