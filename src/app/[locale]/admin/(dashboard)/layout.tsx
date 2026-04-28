import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import React from "react";

import AdminNav from "@/components/AdminNav";

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

  return (
    <div className="min-h-screen bg-white">
      <AdminNav session={session} />
      <main className="p-4 md:p-10 container mx-auto bg-white min-h-[calc(100vh-80px)]">
        {children}
      </main>
    </div>
  );
}
