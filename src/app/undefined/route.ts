import { NextResponse } from 'next/server';

// Handle /undefined requests gracefully
// This is often caused by browser extensions or external scripts
// trying to load resources with undefined URLs
export async function GET() {
  return new NextResponse(null, { 
    status: 204,  // No Content
    headers: {
      'Cache-Control': 'no-store',
    }
  });
}
