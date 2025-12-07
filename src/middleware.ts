import { NextResponse } from "next/server";

// Pass-through middleware to fix redirect loop
// Auth checks are now handled in src/app/admin/layout.tsx
export default function middleware() {
    return NextResponse.next();
}
