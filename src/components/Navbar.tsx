import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, PanelLeft, User, LogOut } from 'lucide-react';
import { SidebarDrawer } from '@/components/SidebarDrawer';
import { AuthModal, getCurrentUser, saveUserSession, UserSession } from '@/components/AuthModal';

interface NavbarProps {
  onOpenGenerator?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenGenerator }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => getCurrentUser());

  useEffect(() => {
    const handleUpdate = () => setCurrentUser(getCurrentUser());
    window.addEventListener('eidolon_user_updated', handleUpdate);
    return () => window.removeEventListener('eidolon_user_updated', handleUpdate);
  }, []);

  const navLinks = [
    { name: 'GALLERY', path: '/gallery' },
    { name: 'COMMUNITY', path: '/gallery?tab=community' },
    { name: 'FEATURES', path: '/#features' },
    { name: 'PRICING', path: '/pricing' },
    { name: 'ABOUT', path: '/about' },
    { name: 'DOCS', path: '/docs' },
  ];

  return (
    <>
      <SidebarDrawer
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenCreate={onOpenGenerator}
      />

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
      />

      <nav className="absolute top-0 left-0 right-0 z-50 px-6 sm:px-12 py-6 flex items-center justify-between border-b border-white/5 bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-[2px]">
        {/* Left Side: Sidebar Toggle & Brand */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition group"
            title="Open Studio Menu"
            aria-label="Open Studio Menu"
          >
            <PanelLeft className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="hidden lg:inline text-xs font-mono uppercase tracking-wider text-gray-400 group-hover:text-gray-200">
              Menu
            </span>
          </button>

          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center">
              Eidolon<span className="text-[#9CA3AF] text-xl font-normal group-hover:text-emerald-400 transition-colors">.monster</span>
            </span>
          </Link>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-9 text-xs tracking-[0.16em] font-medium text-gray-300">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.path}
              className="hover:text-white transition-colors duration-200"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Action Button & Auth Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2 bg-[#12151F] border border-white/10 rounded-full px-3 py-1.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <User className="w-3 h-3 text-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-gray-200">{currentUser.name}</span>
              <button
                type="button"
                onClick={() => saveUserSession(null)}
                className="text-gray-400 hover:text-red-400 transition ml-1 p-0.5"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setAuthOpen(true);
                }}
                className="text-xs font-medium text-gray-300 hover:text-white transition px-3 py-1.5"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setAuthOpen(true);
                }}
                className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 px-3.5 py-1.5 rounded-full transition"
              >
                Sign Up
              </button>
            </div>
          )}

          <button
            onClick={onOpenGenerator}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-emerald-500/40 hover:border-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold tracking-wider transition-all duration-300"
          >
            <span>LAUNCH APP</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile Actions */}
        <div className="flex md:hidden items-center gap-2">
          {!currentUser ? (
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setAuthOpen(true);
              }}
              className="text-[11px] font-semibold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
            >
              Sign In
            </button>
          ) : (
            <button
              type="button"
              onClick={() => saveUserSession(null)}
              className="text-[11px] text-gray-400 hover:text-red-400"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-300 hover:text-white"
            aria-label="Open Studio Menu"
          >
            <PanelLeft className="w-5 h-5 text-emerald-400" />
          </button>
        </div>
      </nav>
    </>
  );
};
