import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage, Language } from "../../contexts/LanguageContext";
import { X, Camera, Globe, Briefcase, Building2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function OnboardingModal() {
  const { profile, updateProfile, loading, user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  
  // Check session storage to prevent reopening in the same session if skipped
  const [isSkippedInSession, setIsSkippedInSession] = useState(
    sessionStorage.getItem("onboarding_skipped") === "true"
  );
  
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    jobRole: "",
    company: "",
    photoURL: "",
  });

  // Sync state with profile when it loads
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        jobRole: profile.jobRole || "",
        company: profile.company || "",
        photoURL: profile.photoURL || "",
      });
    }
    
    // CRITICAL: Only show if loading is finished, user is logged in, 
    // and we are CERTAIN they haven't onboarded yet.
    if (!loading && user) {
      const shouldShow = !profile?.onboarded && !isSkippedInSession;
      setIsOpen(shouldShow);
    } else {
      setIsOpen(false);
    }
  }, [profile, loading, user, isSkippedInSession]);

  if (!isOpen || loading) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({ ...formData, onboarded: true, language });
      sessionStorage.setItem("onboarding_skipped", "true");
      setIsOpen(false);
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Failed to save profile:", error);
      if (error.code === "permission-denied") {
        alert("Database Error: Please check your Firestore Rules in the Firebase Console. Access is currently denied.");
      } else {
        alert("Failed to save profile. Please try again.");
      }
    }
  };

  const handleSkip = async () => {
    try {
      await updateProfile({ onboarded: true });
      sessionStorage.setItem("onboarding_skipped", "true");
      setIsSkippedInSession(true);
      setIsOpen(false);
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Failed to skip onboarding:", error);
      if (error.code === "permission-denied") {
        alert("Database Error: Please check your Firestore Rules in the Firebase Console. Access is currently denied.");
      }
      // Even if update fails, we should close the modal for the session
      setIsOpen(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
        >
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                {t("onboardingTitle")}
              </h2>
              <button onClick={handleSkip} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center mb-8">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 overflow-hidden">
                    {formData.photoURL ? (
                      <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-slate-400" />
                    )}
                  </div>
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t("fullName")}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>

                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t("jobRole")}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                    value={formData.jobRole}
                    onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                  />
                </div>

                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t("company")}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>

                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <select
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white appearance-none"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                  >
                    <option value="en">English</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="flex-1 px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  {t("skip")}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transition-all"
                >
                  {t("save")}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
