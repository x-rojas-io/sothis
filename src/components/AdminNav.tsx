'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bars3Icon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { signOut } from 'next-auth/react';

interface AdminNavProps {
  session: any;
}

export default function AdminNav({ session }: AdminNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  
  const isAdmin = session?.user?.role === 'admin';

  const navLinks = [
    { name: 'Dashboard', href: '/admin' },
    { name: 'Active Clients', href: '/admin/active-clients' },
    { name: 'Book Appointment', href: '/admin/book', highlight: true },
    { name: 'Bookings', href: '/admin/bookings' },
  ];

  const maintenanceLinks = [
    { name: 'Set Availability', href: '/admin/availability' },
    { name: 'Services', href: '/admin/services' },
    { name: 'Staff Users', href: '/admin/staff' },
    { name: 'Client Master', href: '/admin/clients' },
  ];

  return (
    <nav className="bg-stone-900 text-stone-50 p-4 sticky top-0 z-50 shadow-2xl">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4 lg:gap-8">
          <span className="font-serif text-xl md:text-2xl font-black tracking-tighter text-white whitespace-nowrap">
            Sothis <span className="text-stone-500 font-light">{isAdmin ? 'Admin' : 'Provider'}</span>
          </span>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 bg-stone-800/50 p-1 rounded-lg border border-stone-700/50">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`px-4 py-2 rounded-md text-[11px] font-black uppercase tracking-widest transition-all ${
                  link.highlight 
                    ? 'text-[#f5a623] bg-orange-500/10 hover:bg-orange-500/20' 
                    : 'text-stone-300 hover:text-white hover:bg-stone-700'
                }`}
              >
                {link.name}
              </a>
            ))}
            
            {isAdmin && (
              <div className="group relative ml-4 pl-4 border-l border-stone-700">
                <button className="flex items-center gap-2 px-4 py-2 rounded-md text-[11px] font-black uppercase tracking-widest text-stone-400 hover:text-white transition-all">
                  Data Maintenance <ChevronDownIcon className="h-3 w-3" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-56 bg-stone-900 border border-stone-800 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
                  {maintenanceLinks.map((link, idx) => (
                    <React.Fragment key={link.name}>
                      <a
                        href={link.href}
                        className="block px-4 py-3 rounded-md text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 hover:text-white hover:bg-stone-800 transition-all"
                      >
                        {link.name}
                      </a>
                      {idx === 2 && <div className="my-1 border-t border-stone-800"></div>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4 lg:gap-6 items-center">
          {/* User Info - Hidden on small mobile */}
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">{session.user.role} Account</span>
            <span className="text-xs text-stone-300 font-serif italic truncate max-w-[150px]">{session.user.email}</span>
          </div>
          
          <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="hidden md:block px-4 py-2 rounded border border-stone-700 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-stone-900 transition-all"
          >
            Sign Out
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="lg:hidden p-2 text-stone-400 hover:text-white"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-xs bg-stone-900 shadow-2xl z-[70] lg:hidden flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-stone-800">
                <span className="font-serif text-xl font-black tracking-tighter text-white">
                  Sothis <span className="text-stone-500 font-light">Menu</span>
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-stone-400 hover:text-white"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="flex flex-col gap-2">
                  {navLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-4 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                        link.highlight 
                          ? 'text-[#f5a623] bg-orange-500/10 border border-orange-500/20' 
                          : 'text-stone-300 hover:text-white hover:bg-stone-800'
                      }`}
                    >
                      {link.name}
                    </a>
                  ))}
                </div>

                {isAdmin && (
                  <div className="pt-4 border-t border-stone-800">
                    <button 
                      onClick={() => setMaintenanceOpen(!maintenanceOpen)}
                      className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-xs font-black uppercase tracking-widest text-stone-400 hover:text-white transition-all"
                    >
                      Data Maintenance
                      <ChevronDownIcon className={`h-4 w-4 transition-transform ${maintenanceOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {maintenanceOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden ml-4 flex flex-col gap-1 mt-1"
                        >
                          {maintenanceLinks.map((link) => (
                            <a
                              key={link.name}
                              href={link.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="px-4 py-3 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 hover:text-white hover:bg-stone-800 transition-all"
                            >
                              {link.name}
                            </a>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <div className="pt-8 border-t border-stone-800">
                  <div className="px-4 py-4 rounded-xl bg-stone-800/50 border border-stone-700/50 mb-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1">{session.user.role} Account</div>
                    <div className="text-xs text-stone-300 font-serif italic break-all">{session.user.email}</div>
                  </div>
                  <button 
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full px-4 py-4 rounded-xl bg-white text-stone-900 text-xs font-black uppercase tracking-widest hover:bg-stone-200 transition-all shadow-lg"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
