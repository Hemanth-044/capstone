import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth'; // We'll need to adapt verifyToken for Edge Runtime or use jose

// Since verifyToken uses jsonwebtoken which might not be fully Edge compatible without polyfills,
// and we are using standard nodejs runtime for pages, middleware runs on Edge.
// For simplicity in this demo, we can just check for existence of token or client-side protection.
// However, proper way is to use 'jose' library for Edge middleware JWT verification.

// Let's stick to basic redirection if token is missing in valid paths.
// For a production app, we should use 'jose' library.

export function middleware(request: NextRequest) {
    // We can't easily verify JWT signature with 'jsonwebtoken' package in Edge Runtime (Middleware).
    // Implementation of proper JWT verification in middleware usually requires 'jose' or 'jwt-decode' (if no signature check).
    // For this MVP, we will rely on client-side protection + API route protection.
    // Middleware here will just redirect root to login if no auth logic is present? 
    // actually, let's skip complex middleware logic for now to avoid Edge Runtime issues with jsonwebtoken package.

    // Minimal example: Redirect from / to /login
    if (request.nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/login', request.url));
    }
}

export const config = {
    matcher: ['/'],
};
