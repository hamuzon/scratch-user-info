import { NextResponse } from 'next/server';

/**
 * Middleware to normalize FQDN (Fully Qualified Domain Name)
 * by removing a trailing dot from the hostname and redirecting (301).
 */
export function middleware(request) {
  const url = new URL(request.url);

  if (url.hostname.endsWith('.')) {
    url.hostname = url.hostname.slice(0, -1);
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}