import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_NEON_AUTH_URL = 'https://ep-young-term-axk9zwb2.neonauth.c-4.us-east-2.aws.neon.tech/neondb/auth';

/**
 * Proxy handler for Neon Managed Better Auth.
 * Proxies auth requests to NEON_AUTH_BASE_URL and preserves cookies & headers.
 */
async function handleProxy(
  request: NextRequest,
  props: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path } = await props.params;
    const pathSegments = path || [];
    const subPath = Array.isArray(pathSegments) ? pathSegments.join('/') : String(pathSegments);
    const url = new URL(request.url);

    // If request path is /api/auth/status, return status payload directly
    if (subPath === 'status' || url.pathname.endsWith('/status')) {
      return NextResponse.json({
        status: 'ok',
        provider: 'neon_better_auth',
        baseUrl: process.env.NEON_AUTH_BASE_URL || DEFAULT_NEON_AUTH_URL,
      });
    }

    const baseUrl = (process.env.NEON_AUTH_BASE_URL || DEFAULT_NEON_AUTH_URL).replace(/\/+$/, '');
    const targetUrl = new URL(`${baseUrl}/${subPath}${url.search}`);

    // Build headers to forward to Neon Auth
    const forwardHeaders = new Headers();
    request.headers.forEach((val, key) => {
      const lower = key.toLowerCase();
      // Filter out hop-by-hop headers, host, and forwarded headers that could trigger upstream redirects
      if (
        lower !== 'host' &&
        lower !== 'connection' &&
        lower !== 'content-length' &&
        lower !== 'transfer-encoding' &&
        lower !== 'x-forwarded-host' &&
        lower !== 'x-forwarded-proto' &&
        lower !== 'x-forwarded-port' &&
        lower !== 'expect'
      ) {
        forwardHeaders.set(key, val);
      }
    });

    // Ensure Host header matches upstream Neon Auth domain
    forwardHeaders.set('host', targetUrl.host);

    // Ensure Origin header is present for Better Auth CSRF validation
    const origin = request.headers.get('origin') || url.origin || 'http://localhost:3000';
    forwardHeaders.set('origin', origin);

    // Ensure cookie and auth headers are forwarded
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      forwardHeaders.set('cookie', cookieHeader);
    }
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      forwardHeaders.set('authorization', authHeader);
    }

    // Forward request body for non-GET/HEAD methods
    const isBodyAllowed = !['GET', 'HEAD'].includes(request.method.toUpperCase());
    let body: string | undefined = undefined;
    if (isBodyAllowed) {
      try {
        body = await request.text();
      } catch {
        body = undefined;
      }
    }

    const response = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: forwardHeaders,
      body: body && body.length > 0 ? body : undefined,
      redirect: 'follow', // Follow upstream redirects
    });

    // Build response headers to return to client
    const resHeaders = new Headers();
    response.headers.forEach((val, key) => {
      const lower = key.toLowerCase();
      if (
        lower !== 'content-encoding' &&
        lower !== 'transfer-encoding' &&
        lower !== 'connection' &&
        lower !== 'set-cookie'
      ) {
        resHeaders.set(key, val);
      }
    });

    // Forward Set-Cookie headers properly (including multiple cookies)
    if (typeof response.headers.getSetCookie === 'function') {
      const cookies = response.headers.getSetCookie();
      for (const cookie of cookies) {
        resHeaders.append('set-cookie', cookie);
      }
    } else {
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        resHeaders.set('set-cookie', setCookie);
      }
    }

    const responseBody = await response.arrayBuffer();

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: resHeaders,
    });
  } catch (error) {
    console.error('[Neon Auth Proxy Error]:', error);
    return NextResponse.json(
      {
        error: 'Failed to proxy request to Neon Auth',
        details: String((error as any)?.cause || (error as Error).message),
      },
      { status: 502 }
    );
  }
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ path?: string[] }> }
) {
  return handleProxy(request, props);
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ path?: string[] }> }
) {
  return handleProxy(request, props);
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ path?: string[] }> }
) {
  return handleProxy(request, props);
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ path?: string[] }> }
) {
  return handleProxy(request, props);
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ path?: string[] }> }
) {
  return handleProxy(request, props);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
    },
  });
}