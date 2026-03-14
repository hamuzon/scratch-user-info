import { resolveUsername } from './utils/resolver';

const jsonHeaders = {
  'content-type': 'application/json; charset=UTF-8',
};

const NEXT_ORIGIN = 'https://scratch-user-info.vercel.app';

function formatDatetime(datetimeString) {
  try {
    const date = new Date(datetimeString);
    return date.toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '不明';
  }
}

async function handleApiRequest(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: jsonHeaders });
  }

  const rawInput = String(body?.username || '').trim();
  if (!rawInput) {
    return new Response(JSON.stringify({ error: 'username is required' }), { status: 400, headers: jsonHeaders });
  }

  const resolvedUsername = await resolveUsername(rawInput);
  if (!resolvedUsername) {
    return new Response(JSON.stringify({ error: 'username is required' }), { status: 400, headers: jsonHeaders });
  }

  try {
    const userUrl = `https://api.scratch.mit.edu/users/${encodeURIComponent(resolvedUsername)}`;
    const projectsUrl = `https://api.scratch.mit.edu/users/${encodeURIComponent(resolvedUsername)}/projects`;

    // Cache options for Cloudflare
    const fetchOptions = {
      cf: {
        cacheTtl: 300, 
        cacheEverything: true,
      }
    };

    const [userRes, projectsRes] = await Promise.all([
      fetch(userUrl, fetchOptions),
      fetch(projectsUrl, fetchOptions)
    ]);

    if (!userRes.ok) {
      if (userRes.status === 404) {
        return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: jsonHeaders });
      }
      throw new Error(`Scratch API returned ${userRes.status}`);
    }

    const [userInfo, projectsData] = await Promise.all([
      userRes.json(),
      projectsRes.ok ? projectsRes.json() : Promise.resolve([])
    ]);

    const projects = (projectsData || []).map((project) => ({
      ...project,
      published_date: formatDatetime(project.history?.shared),
      modified_date: formatDatetime(project.history?.modified),
    }));

    const responseHeaders = {
      ...jsonHeaders,
      'cache-control': 'public, max-age=300, stale-while-revalidate=600',
    };

    return new Response(JSON.stringify({ user_info: userInfo, projects, resolved_username: resolvedUsername }), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (e) {
    console.error('API handler error:', e);
    return new Response(JSON.stringify({ error: 'Could not fetch data from Scratch API.' }), {
      status: 503,
      headers: jsonHeaders,
    });
  }
}

async function proxyToNext(request) {
  try {
    const url = new URL(request.url);
    const target = new URL(url.pathname + url.search, NEXT_ORIGIN);
    const response = await fetch(new Request(target.toString(), request));

    if (response.status >= 500 && response.status < 600) {
      console.error(`Origin server returned a ${response.status} error for ${target.toString()}.`);
      const requestUrl = new URL(request.url);
      return Response.redirect(requestUrl.origin, 302);
    }

    return response;
  } catch (e) {
    console.error('Proxy error:', e);
    const requestUrl = new URL(request.url);
    return Response.redirect(requestUrl.origin, 302);
  }
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.includes('//')) {
      const newPathname = url.pathname.replace(/\/+/g, '/');
      const newUrl = new URL(url);
      newUrl.pathname = newPathname;
      return Response.redirect(newUrl.toString(), 301);
    }

    if (url.pathname === '/api/user') {
      return handleApiRequest(request);
    }

    return proxyToNext(request);
  }
};
