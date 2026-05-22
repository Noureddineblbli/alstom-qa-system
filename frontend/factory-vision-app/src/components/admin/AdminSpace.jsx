import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Layout, ChevronLeft, LayoutDashboard, Database, Settings, ChevronDown, Menu, X } from 'lucide-react';
import UserManagement from './UserManagement';
import ReferenceManagement from './ReferenceManagement';
import InspectionManagement from './InspectionManagement';
import Dashboard from './dashboard/Dashboard';

export default function AdminSpace({ onExit }) {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('admin_active_tab') || 'dashboard';
  });
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Mobile navbar state
  const [navVisible, setNavVisible] = useState(true);
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (activeTab) {
      localStorage.setItem('admin_active_tab', activeTab);
    }
  }, [activeTab]);

  // Hide navbar on scroll down, show on scroll up
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentScrollY = container.scrollTop;
      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        // Scrolling down — hide
        setNavVisible(false);
        setNavDropdownOpen(false);
      } else {
        // Scrolling up — show
        setNavVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'references', label: 'References', icon: Database },
    { id: 'inspections', label: 'Inspections', icon: Layout },
  ];

  const activeItem = navItems.find(item => item.id === activeTab);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-[#0F1115] flex flex-col md:flex-row"
    >
      {/* ── DESKTOP SIDEBAR (md and up) ── */}
      <aside className="hidden md:flex w-64 bg-[#16191E] border-r border-white/5 flex-col">
        <div className="p-6 border-b border-white/5 flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
            <Settings className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight uppercase">Admin Console</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-white/40 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}

          <div className="pt-4 mt-4 border-t border-white/5">
            <button
              onClick={() => setShowExitConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Exit Admin
            </button>
          </div>
        </nav>

        <div className="p-6 border-t border-white/5 text-[10px] font-mono text-white/20">
          SYSTEM VERSION 2.4.0-REV-12
        </div>
      </aside>

      {/* ── MOBILE LAYOUT ── */}
      <div className="flex flex-col flex-1 min-h-0 md:hidden">

        {/* Sticky top navbar — slides up/down */}
        <motion.header
          animate={{ y: navVisible ? 0 : -80 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="sticky top-0 z-50 bg-[#16191E] border-b border-white/5"
          style={{ willChange: 'transform' }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <Settings className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-xs tracking-tight uppercase">Admin Console</span>
            </div>

            {/* Dropdown toggle — shows active tab + chevron */}
            <button
              onClick={() => setNavDropdownOpen(prev => !prev)}
              className="flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-lg shadow-blue-600/20 transition-all active:scale-95"
            >
              {activeItem && <activeItem.icon className="w-3.5 h-3.5" />}
              <span>{activeItem?.label ?? 'Menu'}</span>
              <motion.span animate={{ rotate: navDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.span>
            </button>
          </div>

          {/* Dropdown menu */}
          <AnimatePresence>
            {navDropdownOpen && (
              <motion.nav
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden border-t border-white/5"
              >
                <div className="p-3 space-y-1">
                  {navItems.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => {
                        setActiveTab(id);
                        setNavDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        activeTab === id
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                          : 'text-white/40 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" /> {label}
                    </button>
                  ))}

                  <div className="pt-2 mt-2 border-t border-white/5">
                    <button
                      onClick={() => {
                        setNavDropdownOpen(false);
                        setShowExitConfirm(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" /> Exit Admin
                    </button>
                  </div>
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </motion.header>

        {/* Scrollable content — this is the scroll container */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-5 space-y-8">
          <MobileContent activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>

      {/* ── DESKTOP CONTENT AREA ── */}
      <main className="hidden md:block flex-1 overflow-y-auto p-10 space-y-8">
        <MobileContent activeTab={activeTab} setActiveTab={setActiveTab} />
      </main>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            onClick={() => setShowExitConfirm(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-[#16191E] border border-white/10 rounded-2xl p-8 shadow-2xl text-center"
          >
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <ChevronLeft className="w-8 h-8 text-red-400" />
            </div>
            <h4 className="text-xl font-bold mb-2">Exit Admin Console?</h4>
            <p className="text-white/40 text-sm mb-8">Are you sure you want to leave the admin space?</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onExit}
                className="py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold transition-all shadow-lg shadow-red-600/20"
              >
                Exit
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

// Extracted content renderer shared between mobile and desktop
function MobileContent({ activeTab, setActiveTab }) {
  if (activeTab === 'dashboard') return <Dashboard setActiveTab={setActiveTab} />;
  if (activeTab === 'users') return <UserManagement />;
  if (activeTab === 'references') return <ReferenceManagement />;
  if (activeTab === 'inspections') return <InspectionManagement />;
  return null;
}