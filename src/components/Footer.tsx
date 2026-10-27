import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#050608] border-t border-white/5 pt-16 pb-12 text-sm text-gray-400">
      <div className="max-w-7xl mx-auto px-6 sm:px-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-white/5">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="inline-block">
              <span className="text-2xl font-extrabold tracking-tight text-white">
                Eidolon<span className="text-gray-400 font-normal">.monster</span>
              </span>
            </Link>
            <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
              Named after ancient Greek <span className="text-gray-300 italic font-serif">εἴδωλον</span>—the phantom apparition or spirit-double. High-fidelity generative character design for mature digital artists, worldbuilders, and dark fantasy creators.
            </p>
            <div className="flex items-center space-x-4 pt-2 text-gray-400">
              <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" aria-label="X Twitter">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://discord.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" aria-label="Discord">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" aria-label="YouTube">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" aria-label="Instagram">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            </div>
          </div>

          {/* Platform Column */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-4">Platform</h4>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li><a href="/#gallery" className="hover:text-emerald-400 transition-colors">Gallery</a></li>
              <li><a href="/#features" className="hover:text-emerald-400 transition-colors">Features</a></li>
              <li><Link to="/pricing" className="hover:text-emerald-400 transition-colors">Pricing</Link></li>
              <li><Link to="/docs" className="hover:text-emerald-400 transition-colors">Docs</Link></li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-4">Company</h4>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li><Link to="/about" className="hover:text-emerald-400 transition-colors">About</Link></li>
              <li><a href="#careers" className="hover:text-emerald-400 transition-colors">Careers</a></li>
              <li><a href="#news" className="hover:text-emerald-400 transition-colors">News</a></li>
              <li><a href="mailto:contact@eidolon.monster" className="hover:text-emerald-400 transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-4">Legal</h4>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li><Link to="/legal" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
              <li><Link to="/legal?tab=privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/legal?tab=billing" className="hover:text-emerald-400 transition-colors">Refund & Billing</Link></li>
              <li><Link to="/legal?tab=aup" className="hover:text-emerald-400 transition-colors">Content & 18+ Rules</Link></li>
              <li><span className="inline-block mt-2 px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-gray-400">Age 18+ Only</span></li>
            </ul>
          </div>
        </div>

        {/* Copyright notice matching reference exactly */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
          <p>© 2026 Eidolon.monster. All rights reserved.</p>
          <p className="text-[11px] text-gray-400">
            Compliant generative synthesis engine. Strictly for adult professional creators.
          </p>
        </div>
      </div>
    </footer>
  );
};
