import { NextResponse } from 'next/server';


export function middleware(request) {
  const url = new URL(request.url);

  if (url.hostname.endsWith('.')) {
    url.hostname = url.hostname.slice(0, -1);
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}