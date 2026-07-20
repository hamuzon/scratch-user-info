const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'Content-Type',
  'access-control-max-age': '86400',
};

const jsonHeaders = {
  'content-type': 'application/json; charset=UTF-8',
  'cache-control': 'no-store',
  ...corsHeaders,
};

const NEXT_ORIGIN = 'https://scratch-user-info.vercel.app';
const PROJECT_LIMIT = 10;

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

function getProjectCount(userInfo) {
  if (!userInfo) return null;

  return (
    userInfo?.profile?.stats?.project_count ??
    userInfo?.profile?.stats?.projects ??
    userInfo?.profile?.statistics?.project_count ??
    userInfo?.profile?.statistics?.projects ??
    userInfo?.stats?.project_count ??
    userInfo?.project_count ??
    null
  );
}

async function getTotalProjectCount(username) {
  const countLimit = 40;
  let total = 0;

  while (true) {
    const countUrl = `https://api.scratch.mit.edu/users/${encodeURIComponent(username)}/projects?limit=${countLimit}&offset=${total}`;
    const response = await fetch(countUrl);
    if (!response.ok) {
      return total;
    }

    const pageProjects = await response.json();
    if (!Array.isArray(pageProjects) || pageProjects.length === 0) {
      return total;
    }

    total += pageProjects.length;
    if (pageProjects.length < countLimit) {
      return total;
    }
  }
}

async function getProjectAuthorUsername(projectId) {
  try {
    const response = await fetch(`https://api.scratch.mit.edu/projects/${projectId}`);
    if (!response.ok) {
      return '';
    }
    const project = await response.json();
    return project?.author?.username || '';
  } catch {
    return '';
  }
}

async function resolveUsername(input) {
  const trimmed = input.trim();
  const normalized = trimmed
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/^\/+/, '');

  const scratchUserMatch = normalized.match(/^(?:scratch\.mit\.edu\/)?users\/([A-Za-z0-9_-]+)(?:[/?#].*)?$/i);
  if (scratchUserMatch?.[1]) {
    return scratchUserMatch[1];
  }

  const scratchApiUserMatch = normalized.match(/^(?:api\.scratch\.mit\.edu\/)?users\/([A-Za-z0-9_-]+)(?:[/?#].*)?$/i);
  if (scratchApiUserMatch?.[1]) {
    return scratchApiUserMatch[1];
  }

  const scratchProjectMatch = normalized.match(/^(?:scratch\.mit\.edu\/)?projects\/(\d+)(?:[/?#].*)?$/i);
  if (scratchProjectMatch?.[1]) {
    return getProjectAuthorUsername(scratchProjectMatch[1]);
  }

  const turboWarpProjectMatch = normalized.match(/^(?:turbowarp\.org\/)?(\d+)(?:[/?#].*)?$/i);
  if (turboWarpProjectMatch?.[1]) {
    return getProjectAuthorUsername(turboWarpProjectMatch[1]);
  }

  const singleSegmentMatch = normalized.match(/^([A-Za-z0-9_-]{3,20})(?:[/?#].*)?$/);
  if (singleSegmentMatch?.[1]) {
    const candidate = singleSegmentMatch[1];

    if (/^\d+$/.test(candidate)) {
      return getProjectAuthorUsername(candidate);
    }

    return candidate;
  }

  return '';
}

async function handleApiRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

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
    const requestedPage = Math.max(1, Math.floor(Number(body.page) || 1));
    const userUrl = `https://api.scratch.mit.edu/users/${encodeURIComponent(resolvedUsername)}`;
    const userRes = await fetch(userUrl);

    if (!userRes.ok) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: jsonHeaders });
    }

    const userInfo = await userRes.json();
    const countedProjectCount = await getTotalProjectCount(resolvedUsername);
    const profileProjectCount = getProjectCount(userInfo);
    const projectCount = countedProjectCount || profileProjectCount || 0;
    const lastPage = Math.max(1, Math.ceil(projectCount / PROJECT_LIMIT));
    const currentPage = Math.min(requestedPage, lastPage);
    const offset = (currentPage - 1) * PROJECT_LIMIT;
    const projectsUrl = `https://api.scratch.mit.edu/users/${encodeURIComponent(resolvedUsername)}/projects?limit=${PROJECT_LIMIT}&offset=${offset}`;
    const projectsRes = await fetch(projectsUrl);

    let projects = [];
    if (projectsRes.ok) {
      projects = await projectsRes.json();
      projects = projects.map((project) => ({
        id: project.id,
        title: project.title,
        instructions: project.instructions,
        description: project.description,
        published_date: formatDatetime(project.history?.shared),
        modified_date: formatDatetime(project.history?.modified),
      }));
    }

    return new Response(JSON.stringify({
      user_info: userInfo,
      projects,
      project_count: projectCount,
      current_page: currentPage,
      resolved_username: resolvedUsername,
    }), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (e) {
    console.error('API handler error:', e);
    return new Response(JSON.stringify({ error: 'Could not fetch data from Scratch API.' }), {
      status: 503, // Service Unavailable
      headers: jsonHeaders,
    });
  }
}

async function proxyToNext(request) {
  try {
    const url = new URL(request.url);
    const target = new URL(url.pathname + url.search, NEXT_ORIGIN);
    
    // Create a new request with the original headers
    const newHeaders = new Headers(request.headers);
    // Explicitly set the Host header to the target origin's host
    // This is required for Vercel to route the request correctly
    newHeaders.set('Host', target.host);
    
    const response = await fetch(new Request(target.toString(), {
      method: request.method,
      headers: newHeaders,
      body: request.body,
      redirect: 'follow'
    }));

    // オリジンサーバーが5xx系エラーを返した場合、トップページにリダイレクトする
    if (response.status >= 500 && response.status < 600) {
      console.error(`Origin server returned a ${response.status} error for ${target.toString()}.`);
      const requestUrl = new URL(request.url);
      return Response.redirect(requestUrl.origin, 302);
    }

    return response;
  } catch (e) {
    console.error('Proxy error:', e);
    // プロキシ処理中にエラーが発生した場合もトップページにリダイレクトする
    const requestUrl = new URL(request.url);
    return Response.redirect(requestUrl.origin, 302);
  }
}

function normalizeDotHost(request) {
  const url = new URL(request.url);
  if (url.hostname.endsWith('.')) {
    url.hostname = url.hostname.slice(0, -1);
    return Response.redirect(url.toString(), 301);
  }
  return null;
}

export default {
  async fetch(request) {
    const dotRedirect = normalizeDotHost(request);
    if (dotRedirect) {
      return dotRedirect;
    }

    const url = new URL(request.url);

    // URL に // が含まれている場合、 / に正規化してリダイレクトする
    // これにより、`https://scratch-user-info.hamusata.workers.dev//` のようなURLで
    // プロキシエラーが発生するのを防ぐ
    if (url.pathname.includes('//')) {
      const newPathname = url.pathname.replace(/\/+/g, '/');
      const newUrl = new URL(url);
      newUrl.pathname = newPathname;
      return Response.redirect(newUrl.toString(), 301);
    }

    if (url.pathname === '/api/user') {
      return handleApiRequest(request);
    }

    if (url.pathname.startsWith('/_next/data/')) {
      return Response.redirect(new URL(url.origin).toString(), 302);
    }

    return proxyToNext(request);
  }
};
