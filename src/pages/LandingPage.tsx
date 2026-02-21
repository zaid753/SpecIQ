import { motion, useScroll, useTransform, useSpring, useInView, useMotionValue, animate } from "motion/react";
import { 
  Mail, 
  MessageSquare, 
  Users, 
  ArrowRight, 
  Zap, 
  Shield, 
  BarChart3,
  Menu,
  X,
  Sparkles,
  FileText,
  Layers,
  FileSpreadsheet
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Counter({ value, suffix = "" }: { value: string, suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    if (latest >= 1000000) return (latest / 1000000).toFixed(1) + "M";
    if (latest >= 1000) return (latest / 1000).toFixed(0) + "k";
    return Math.round(latest).toString();
  });
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    if (isInView) {
      let numericValue = 0;
      const cleanValue = value.replace(/[+,]/g, "");
      if (cleanValue.endsWith("M")) {
        numericValue = parseFloat(cleanValue) * 1000000;
      } else if (cleanValue.endsWith("k")) {
        numericValue = parseFloat(cleanValue) * 1000;
      } else {
        numericValue = parseFloat(cleanValue);
      }

      const controls = animate(count, numericValue, {
        duration: 2,
        ease: "easeOut",
      });
      return controls.stop;
    }
  }, [isInView, value, count]);

  useEffect(() => {
    return rounded.on("change", (v) => setDisplayValue(v));
  }, [rounded]);

  return <span ref={ref}>{displayValue}{suffix}</span>;
}

export default function LandingPage() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const rotateX = useTransform(smoothProgress, [0, 0.3], [0, 25]);
  const rotateY = useTransform(smoothProgress, [0, 0.3], [0, -5]);
  const translateZ = useTransform(smoothProgress, [0, 0.3], [0, -100]);
  const scale = useTransform(smoothProgress, [0, 0.3], [1, 0.85]);
  const opacity = useTransform(smoothProgress, [0, 0.15], [1, 0.7]);

  return (
    <div ref={containerRef} className="min-h-screen font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900/30 bg-white dark:bg-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Zap className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-display font-bold tracking-tight dark:text-white">SpecIq</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#home" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</a>
              <a href="#about" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">About</a>
              {user ? (
                <Link to="/dashboard" className="bg-indigo-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 dark:shadow-indigo-900/20">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Login</Link>
                  <Link to="/login" className="bg-indigo-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 dark:shadow-indigo-900/20">
                    Get Started
                  </Link>
                </>
              )}
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-600 dark:text-slate-400">
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 py-6 space-y-4 shadow-xl"
          >
            <a href="#home" className="block text-base font-medium text-slate-600 dark:text-slate-400">Home</a>
            <a href="#about" className="block text-base font-medium text-slate-600 dark:text-slate-400">About</a>
            {user ? (
              <Link to="/dashboard" className="block w-full text-center bg-indigo-600 text-white px-5 py-3 rounded-xl text-base font-semibold">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="block text-base font-medium text-slate-600 dark:text-slate-400">Login</Link>
                <Link to="/login" className="block w-full text-center bg-indigo-600 text-white px-5 py-3 rounded-xl text-base font-semibold">
                  Get Started
                </Link>
              </>
            )}
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 px-4 perspective-1000 overflow-hidden">
        <motion.div 
          style={{ rotateX, rotateY, translateZ, scale, opacity }}
          className="max-w-7xl mx-auto text-center preserve-3d"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-xs font-bold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-950/50 rounded-full border border-indigo-100 dark:border-indigo-900/50">
              <Sparkles className="w-3 h-3" />
              By Team AlphaBuild
            </div>
            <h1 className="text-5xl md:text-8xl font-display font-bold tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.1]">
              Extract Requirements <br />
              <span className="gradient-text">From Every Conversation</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
              SpecIq intelligently parses your emails, chats, and meeting transcripts to build structured business requirements in seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={user ? "/dashboard" : "/login"} className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40 flex items-center justify-center gap-2 group">
                {user ? "Go to Dashboard" : "Get Started Free"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="w-full sm:w-auto glass text-slate-700 dark:text-slate-200 px-8 py-4 rounded-full text-lg font-bold hover:bg-white dark:hover:bg-slate-800 transition-all">
                Watch Demo
              </button>
            </div>
          </motion.div>

          {/* 3D Dashboard Mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 40, rotateX: 20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
            className="mt-16 relative perspective-1000"
          >
            <div className="glass rounded-2xl p-2 md:p-4 shadow-2xl max-w-5xl mx-auto overflow-hidden border border-white/40 dark:border-slate-700/50 transform-gpu hover:rotate-y-2 transition-transform duration-500">
              <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden aspect-[16/10] relative">
                <div className="absolute inset-0 p-8 text-left overflow-hidden pointer-events-none">
                  <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-700 pb-4">
                    <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-indigo-100 dark:bg-indigo-900/50 rounded" />
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-slate-300 dark:bg-slate-600 rounded" />
                      <div className="h-3 w-full bg-slate-100 dark:bg-slate-700/50 rounded" />
                      <div className="h-3 w-5/6 bg-slate-100 dark:bg-slate-700/50 rounded" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border border-slate-100 dark:border-slate-700 rounded-lg space-y-2">
                        <div className="h-3 w-20 bg-emerald-100 dark:bg-emerald-900/30 rounded" />
                        <div className="h-2 w-full bg-slate-50 dark:bg-slate-800 rounded" />
                        <div className="h-2 w-3/4 bg-slate-50 dark:bg-slate-800 rounded" />
                      </div>
                      <div className="p-4 border border-slate-100 dark:border-slate-700 rounded-lg space-y-2">
                        <div className="h-3 w-20 bg-indigo-100 dark:bg-indigo-900/30 rounded" />
                        <div className="h-2 w-full bg-slate-50 dark:bg-slate-800 rounded" />
                        <div className="h-2 w-3/4 bg-slate-50 dark:bg-slate-800 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <img 
                  src="https://picsum.photos/seed/speciq-brd-v3/1200/800?blur=2" 
                  alt="SpecIq Dashboard" 
                  className="w-full h-full object-cover opacity-30 mix-blend-overlay transition-opacity duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/80 dark:from-slate-900/80 to-transparent pointer-events-none" />
                
                <div className="absolute top-4 left-4 flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -right-10 hidden lg:block glass p-4 rounded-2xl shadow-xl border-indigo-100 dark:border-indigo-900/30"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center">
                  <FileText className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Spec</div>
                  <div className="text-sm font-bold dark:text-white">Mobile App V2.0</div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-10 -left-10 hidden lg:block glass p-4 rounded-2xl shadow-xl border-emerald-100 dark:border-emerald-900/30"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-950 rounded-full flex items-center justify-center">
                  <MessageSquare className="text-indigo-600 dark:text-indigo-400 w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Source</div>
                  <div className="text-sm font-bold dark:text-white">Slack Thread #dev</div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute -bottom-4 right-4 md:-right-12 md:top-1/2 glass p-3 rounded-xl shadow-lg border-indigo-100 dark:border-indigo-900/30 z-20"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <FileSpreadsheet className="text-white w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Export</div>
                  <div className="text-xs font-bold dark:text-white">requirements.csv</div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 }}
              className="absolute -top-4 left-4 md:-left-12 md:bottom-1/4 glass p-3 rounded-xl shadow-lg border-red-100 dark:border-red-900/30 z-20"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                  <FileText className="text-white w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Export</div>
                  <div className="text-xs font-bold dark:text-white">spec_v1.pdf</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="about" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-slate-900 dark:text-white mb-4">One Platform, Three Sources</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg">We bridge the gap between messy communication and structured project specifications.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Mail className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
                title: "Email Extraction",
                desc: "Automatically parse long email threads to identify key deliverables, deadlines, and constraints.",
                color: "bg-indigo-50 dark:bg-indigo-950/30"
              },
              {
                icon: <MessageSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
                title: "Chat Analysis",
                desc: "Turn Slack or Teams discussions into structured user stories and acceptance criteria instantly.",
                color: "bg-emerald-50 dark:bg-emerald-950/30"
              },
              {
                icon: <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />,
                title: "Meeting Transcripts",
                desc: "Upload meeting recordings or transcripts to generate comprehensive BRDs and action items.",
                color: "bg-orange-50 dark:bg-orange-950/30"
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -10 }}
                className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all group"
              >
                <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Requirements Extracted", value: "2M", suffix: "+" },
              { label: "Hours Saved", value: "500k", suffix: "" },
              { label: "Active Teams", value: "12k", suffix: "+" },
              { label: "Accuracy Rate", value: "99.2", suffix: "%" }
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl md:text-5xl font-display font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Zap className="text-white w-5 h-5" />
                </div>
                <span className="text-2xl font-display font-bold dark:text-white">SpecIq</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm text-lg leading-relaxed">
                The intelligent layer for your business communication. Built by Team AlphaBuild for the modern enterprise.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6 dark:text-white">Product</h4>
              <ul className="space-y-4 text-slate-500 dark:text-slate-400">
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 dark:text-white">Company</h4>
              <ul className="space-y-4 text-slate-500 dark:text-slate-400">
                <li><a href="#" className="hover:text-indigo-600 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Terms <span className="text-[10px] font-bold text-indigo-500 ml-1">Admin Panel</span></a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-12 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-400 text-sm">
              © 2024 AlphaBuild. All rights reserved.
            </p>
            <div className="flex gap-8">
              <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors"><Shield className="w-5 h-5" /></a>
              <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors"><BarChart3 className="w-5 h-5" /></a>
              <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors"><Sparkles className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
