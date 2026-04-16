import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const role = (session?.user as any)?.role;
        if (role !== "admin" && role !== "provider") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

        const clientId = new URL(request.url).searchParams.get("client_id");
        if (!clientId) return NextResponse.json({ error: "Client ID required" }, { status: 400 });

        const { data: intake } = await supabaseAdmin.from("intake_forms").select("*").eq("client_id", clientId).order("created_at", { ascending: false }).limit(1).maybeSingle();
        
        let auditHistory = [];
        if (intake?.id) {
            const { data } = await supabaseAdmin.from("intake_form_audit").select("*, modified_by_user:modified_by(name, email)").eq("intake_form_id", intake.id).order("created_at", { ascending: false });
            auditHistory = data || [];
        }
        return NextResponse.json({ intake, auditHistory });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const role = (session?.user as any)?.role;
        if (role !== "admin" && role !== "provider") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

        const body = await request.json();
        const { id, therapist_signature_name } = body;
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        const forwarded = request.headers.get("x-forwarded-for");
        const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";

        const { data: intake, error: intakeError } = await supabaseAdmin.from("intake_forms").update({
            therapist_signature_name,
            therapist_signature_at: new Date().toISOString(),
            therapist_signature_ip: ip,
            medical_history: body.questions || body.medical_history,
            concentrate_on: body.concentrate_on,
            updated_by: (session as any)?.user?.id,
            ip_address: ip
        }).eq("id", id).select().single();

        if (intakeError) throw intakeError;

        await supabaseAdmin.from("intake_form_audit").insert({
            intake_form_id: id,
            modified_by: (session as any)?.user?.id,
            snapshot: body,
            ip_address: ip,
            therapist_signature_name,
            therapist_signature_ip: ip
        });

        return NextResponse.json({ success: true, intake });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}