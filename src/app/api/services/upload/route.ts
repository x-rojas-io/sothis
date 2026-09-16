import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const BUCKET_NAME = 'service-images';

async function ensureBucketExists() {
    try {
        const { data: buckets } = await supabaseAdmin.storage.listBuckets();
        const exists = buckets?.some(b => b.name === BUCKET_NAME);
        if (!exists) {
            await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
                public: true,
                fileSizeLimit: 10485760, // 10MB
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
            });
        }
    } catch (e) {
        console.warn('Bucket verification warning:', e);
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate MIME type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Allowed: PNG, JPEG, JPG, WEBP, SVG.' }, { status: 400 });
        }

        // Validate size (10MB max)
        const MAX_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: 'File size exceeds 10MB limit.' }, { status: 400 });
        }

        await ensureBucketExists();

        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
        const sanitizedBaseName = file.name
            .replace(/\.[^/.]+$/, '')
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, '-');
        const fileName = `${sanitizedBaseName}-${Date.now()}.${fileExt}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) {
            console.error('Supabase storage upload error:', uploadError);
            return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
        }

        const { data: publicUrlData } = supabaseAdmin.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

        return NextResponse.json({
            url: publicUrlData.publicUrl,
            fileName: fileName
        });
    } catch (error: any) {
        console.error('Error handling image upload:', error);
        return NextResponse.json({ error: error?.message || 'Failed to upload image' }, { status: 500 });
    }
}
