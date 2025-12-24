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
      <nav className="bg-stone-900 text-stone-50 p-4 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <span className="font-serif text-xl">Sothis {isAdmin ? 'Admin' : 'Provider'}</span>
          <div className="flex gap-6 text-sm items-center">
            <nav className="flex gap-4">
              <a href="/admin" className="text-stone-300 hover:text-white transition-colors">Dashboard</a>
              <a href="/admin/availability" className="text-stone-300 hover:text-white transition-colors">Availability</a>
              <a href="/admin/bookings" className="text-stone-300 hover:text-white transition-colors">Bookings</a>
              {isAdmin && (
                <>
                  <a href="/admin/clients" className="text-stone-300 hover:text-white transition-colors">Clients</a>
                  <a href="/admin/staff" className="text-stone-300 hover:text-white transition-colors">Staff Users</a>
                </>
              )}
            </nav>
            <div className="h-4 w-px bg-stone-700"></div>
            <div className="flex gap-4 items-center">
              <span className="text-stone-400">{session.user.email}</span>
              <a href="/api/auth/signout" className="underline text-stone-400 hover:text-white">Sign Out</a>
            </div>
          </div>
        </div>
      </nav>
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}
