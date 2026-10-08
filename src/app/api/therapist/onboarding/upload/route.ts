import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { requireTherapistApplicant } from '../../../../../lib/therapist/therapistAuthHelper';
import { supabase } from '../../../../../lib/db';
export const runtime = 'nodejs';
const BUCKET = 'therapist-verification';
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(['application/pdf','image/jpeg','image/png','image/webp']);
const CATEGORIES = new Set(['profile_photo','degree_certificate','trauma_certification','primary_modality_certificate','secondary_modality_certificate','supervision_confirmation']);
function safeName(name: string) { return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-160); }
export async function POST(request: NextRequest) {
  try {
    const { account } = await requireTherapistApplicant(request);
    const form = await request.formData();
    const file = form.get('file');
    const category = String(form.get('category') || '');
    const metadataRaw = String(form.get('metadata') || '{}');
    if (!(file instanceof File)) return NextResponse.json({ error:{code:'FILE_REQUIRED',message:'A file is required.'}},{status:400});
    if (!CATEGORIES.has(category)) return NextResponse.json({ error:{code:'INVALID_CATEGORY',message:'Invalid document category.'}},{status:400});
    if (file.size <= 0 || file.size > MAX_BYTES) return NextResponse.json({ error:{code:'FILE_TOO_LARGE',message:'Each file must be between 1 byte and 10 MB.'}},{status:400});
    if (!ALLOWED.has(file.type)) return NextResponse.json({ error:{code:'UNSUPPORTED_FILE_TYPE',message:'Only PDF, JPG, PNG and WEBP files are supported.'}},{status:400});
    let metadata: Record<string, unknown> = {}; try { metadata = JSON.parse(metadataRaw); } catch {}
    const path = `${account.id}/${category}/${randomUUID()}-${safeName(file.name)}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, { contentType:file.type, upsert:false });
    if (error) throw new Error(`Unable to upload file: ${error.message}`);
    return NextResponse.json({ success:true, document:{ path, bucket:BUCKET, filename:file.name, mimeType:file.type, size:file.size, category, metadata, uploadedAt:new Date().toISOString(), verificationStatus:'pending' } });
  } catch (err:any) {
    return NextResponse.json({ error:{code:err.code||'UPLOAD_ERROR',message:err.message||'Upload failed.'} },{status:err.status||500});
  }
}
