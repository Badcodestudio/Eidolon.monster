import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Image,
  Box,
  Compass,
  History,
  Film,
  CreditCard,
  Lightbulb,
  BarChart3,
  HelpCircle,
  FileCheck,
  ShieldAlert,
  X,
  ChevronRight,
  User,
  LogOut,
} from 'lucide-react';
import { AuthModal, getCurrentUser, saveUserSession, UserSession } from '@/components/AuthModal';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreate?: () => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  onOpenCreate,
}) => {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState<string>('create');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => getCurrentUser());

  useEffect(() => {
    const handleUpdate = () => setCurrentUser(getCurrentUser());
    window.addEventListener('eidolon_user_updated', handleUpdate);
    return () => window.removeEventListener('eidolon_user_updated', handleUpdate);
  }, []);

  if (!isOpen) return null;

  const menuItems = [
    {
      id: 'create',
      label: 'Create',
      icon: Sparkles,
      highlight: true,
      action: () => {
        onClose();
        if (onOpenCreate) {
          onOpenCreate();
        } else {
          navigate('/create');
        }
      },
    },
    {
      id: 'gallery',
      label: 'My Gallery',
      icon: Image,
      badge: 'Local',
      action: () => {
        onClose();
        navigate('/gallery?tab=community');
      },
    },
    {
      id: '3d-models',
      label: '3D Models',
      icon: Box,
      badge: 'Live',
      action: () => {
        onClose();
        navigate('/3d-models');
      },
    },
    {
      id: 'explore',
      label: 'Explore',
      icon: Compass,
      action: () => {
        onClose();
        navigate('/gallery');
      },
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      action: () => {
        onClose();
        navigate('/history');
      },
    },
    {
      id: 'clip-gallery',
      label: 'Clip Gallery',
      icon: Film,
      action: () => {
        onClose();
        navigate('/#gallery');
      },
    },
    {
      id: 'plans',
      label: 'Plans',
      icon: CreditCard,
      action: () => {
        onClose();
        navigate('/pricing');
      },
    },
    {
      id: 'concepts',
      label: 'Concepts',
      icon: Lightbulb,
      action: () => {
        onClose();
        navigate('/about');
      },
    },
    {
      id: 'usage-stats',
      label: 'Usage Stats',
      icon: BarChart3,
      badge: 'Live',
      action: () => {
        onClose();
        navigate('/pricing');
      },
    },
    {
      id: 'tips',
      label: 'Tips',
      icon: Lightbulb,
      action: () => {
        onClose();
        navigate('/docs');
      },
    },
    {
      id: 'help',
      label: 'Help',
      icon: HelpCircle,
      action: () => {
        onClose();
        navigate('/docs');
      },
    },
    {
      id: 'guidelines',
      label: 'Guidelines',
      icon: FileCheck,
      action: () => {
        onClose();
        navigate('/legal');
      },
    },
    {
      id: 'admin',
      label: 'Admin Console',
      icon: ShieldAlert,
      badge: 'Operator',
      action: () => {
        onClose();
        navigate('/admin');
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <aside className="relative w-72 sm:w-80 max-w-[85vw] h-full bg-[#12141C] border-r border-white/10 shadow-2xl flex flex-col justify-between z-10 overflow-hidden text-gray-200 font-sans">
        {/* Top Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-sm tracking-wider uppercase text-white font-mono">
              Eidolon<span className="text-emerald-400">.monster</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isHighlight = item.highlight;
            const isCurrent = activeItem === item.id;

            if (isHighlight) {
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveItem(item.id);
                    item.action();
                  }}
                  className="w-full mb-3 flex items-center justify-between px-3.5 py-3 rounded-xl bg-[#F7E7CE] hover:bg-[#F3DCBC] text-[#3A2208] font-bold text-sm shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-[#8B4513] group-hover:rotate-12 transition-transform" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveItem(item.id);
                  item.action();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors text-left ${
                  isCurrent
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-gray-400 group-hover:text-white" />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-gray-300 border border-white/5">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Account Footer */}
        <div className="p-4 border-t border-white/10 space-y-3 bg-[#0B0D13]">
          {/* Account Profile Trigger */}
          {currentUser ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#161922] border border-white/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-emerald-400 font-mono">{currentUser.tier}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => saveUserSession(null)}
                className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setAuthOpen(true);
                }}
                className="py-2 px-3 rounded-xl bg-[#252836] hover:bg-[#2D3142] text-gray-200 text-xs font-semibold tracking-wide transition border border-white/5 shadow-sm text-center"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setAuthOpen(true);
                }}
                className="py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold tracking-wide transition text-center shadow-sm"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </aside>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
};
