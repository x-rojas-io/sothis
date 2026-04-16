import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import React from "react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    // If not logged in, force signin
    redirect("/admin/login?callbackUrl=/admin");
  }

  if (session?.user?.role !== "admin" && session?.user?.role !== "provider") {
    // If logged in but not admin or provider, kick them out
    redirect("/");
  }

  const isAdmin = session?.user?.role === "admin";

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-stone-900 text-stone-50 p-4 sticky top-0 z-50 shadow-2xl">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <span className="font-serif text-2xl font-black tracking-tighter text-white">Sothis <span className="text-stone-500 font-light">{isAdmin ? 'Admin' : 'Provider'}</span></span>
            
            <nav className="hidden lg:flex items-center gap-1 bg-stone-800/50 p-1 rounded-lg border border-stone-700/50">
              <a href="/admin" className="px-4 py-2 rounded-md text-[11px] font-black uppercase tracking-widest text-stone-300 hover:text-white hover:bg-stone-700 transition-all">Dashboard</a>
              <a href="/admin/active-clients" className="px-4 py-2 rounded-md text-[11px] font-black uppercase tracking-widest text-stone-300 hover:text-white hover:bg-stone-700 transition-all">Active Clients</a>
              <a href="/admin/book" className="px-4 py-2 rounded-md text-[11px] font-black uppercase tracking-widest text-[#f5a623] bg-orange-500/10 hover:bg-orange-500/20 transition-all">Book Appointment</a>
              <a href="/admin/bookings" className="px-4 py-2 rounded-md text-[11px] font-black uppercase tracking-widest text-stone-300 hover:text-white hover:bg-stone-700 transition-all">Bookings</a>
              
              {isAdmin && (
                <div className="group relative ml-4 pl-4 border-l border-stone-700">
                  <button className="flex items-center gap-2 px-4 py-2 rounded-md text-[11px] font-black uppercase tracking-widest text-stone-400 hover:text-white transition-all">
                    Data Maintenance <span>▼</span>
                  </button>
                  <div className="absolute top-full left-0 mt-2 w-56 bg-stone-900 border border-stone-800 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
                    <a href="/admin/availability" className="block px-4 py-3 rounded-md text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 hover:text-white hover:bg-stone-800 transition-all">Set Availability</a>
                    <a href="/admin/services" className="block px-4 py-3 rounded-md text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 hover:text-white hover:bg-stone-800 transition-all">Services</a>
                    <a href="/admin/staff" className="block px-4 py-3 rounded-md text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 hover:text-white hover:bg-stone-800 transition-all">Staff Users</a>
                    <div className="my-1 border-t border-stone-800"></div>
                    <a href="/admin/clients" className="block px-4 py-3 rounded-md text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 hover:text-white hover:bg-stone-800 transition-all">Client Master</a>
                  </div>
                </div>
              )}
            </nav>
          </div>

          <div className="flex gap-6 items-center">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">{session.user.role} Account</span>
              <span className="text-xs text-stone-300 font-serif italic">{session.user.email}</span>
            </div>
            <a href="/api/auth/signout" className="px-4 py-2 rounded border border-stone-700 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-stone-900 transition-all">Sign Out</a>
          </div>
        </div>
      </nav>
      <main className="p-10 container mx-auto bg-white min-h-[calc(100vh-80px)]">
        {children}
      </main>
    </div>
  );
}
