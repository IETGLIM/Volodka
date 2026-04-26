import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import {
  extractBearerToken,
  isFeatureFlagEnabled,
  isSafeBlobFilename,
  MAX_MODEL_UPLOAD_BYTES,
} from '@/lib/apiRouteSecurity';

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isFeatureFlagEnabled(process.env.ENABLE_MODEL_UPLOAD_API)) {
    return NextResponse.json(
      { error: 'Model upload API is disabled', code: 'MODEL_UPLOAD_DISABLED' },
      { status: 403 },
    );
  }

  const secret = process.env.MODEL_UPLOAD_API_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: 'MODEL_UPLOAD_API_SECRET is required when upload API is enabled', code: 'MODEL_UPLOAD_SECRET_MISSING' },
      { status: 503 },
    );
  }

  if (extractBearerToken(request.headers.get('authorization')) !== secret) {
    return NextResponse.json(
      { error: 'Authorization: Bearer <MODEL_UPLOAD_API_SECRET> required', code: 'MODEL_UPLOAD_UNAUTHORIZED' },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename')?.trim() ?? '';
  if (!filename) {
    return NextResponse.json({ error: 'Missing filename' }, { status: 400 });
  }
  if (!isSafeBlobFilename(filename)) {
    return NextResponse.json({ error: 'Unsafe filename', code: 'MODEL_UPLOAD_BAD_FILENAME' }, { status: 400 });
  }

  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const n = Number(contentLength);
    if (Number.isFinite(n) && n > MAX_MODEL_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'Upload too large', code: 'MODEL_UPLOAD_TOO_LARGE' },
        { status: 413 },
      );
    }
  }

  try {
    // request.body is ReadableStream | null; Vercel Blob put accepts ReadableStream, Buffer, Blob, etc.
    const blob = await put(filename, request.body ?? new Blob(), {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log(`✅ Uploaded to Blob: ${blob.url}`);
    return NextResponse.json(blob);
  } catch (error) {
    console.error('Blob upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
