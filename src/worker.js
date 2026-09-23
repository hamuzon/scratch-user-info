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

const PROJECT_LIMIT = 10;

const HOME_HTML = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Scratch User Info</title>
  <style>
    body { max-width: 720px; margin: 2rem auto; padding: 0 1rem; font-family: sans-serif; line-height: 1.6; }
    form { display: flex; gap: .5rem; }
    input { flex: 1; padding: .6rem; }
    button { padding: .6rem 1rem; cursor: pointer; }
    pre { white-space: pre-wrap; overflow-wrap: anywhere; background: #f4f4f4; padding: 1rem; }
  </style>
</head>
<body>
  <h1>Scratch User Info</h1>
  <form id="user-form">
    <input id="username" name="username" placeholder="Scratchユーザー名または作品URL" required>
    <button type="submit">検索</button>
  </form>
  <p id="status"></p>
  <pre id="result" hidden></pre>
  <script>
    const form = document.getElementById('user-form');
    const input = document.getElementById('username');
    const status = document.getElementById('status');
    const result = document.getElementById('result');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      status.textContent = '取得中...';
      result.hidden = true;
      try {
        const response = await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: input.value })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '取得に失敗しました');
        status.textContent = data.resolved_username + ' の情報';
        result.textContent = JSON.stringify(data, null, 2);
        result.hidden = false;
      } catch (error) {
        status.textContent = error.message;
      }
    });
  </script>
</body>
</html>`;

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

    if (url.pathname === '/') {
      return new Response(HOME_HTML, {
        status: 200,
        headers: { 'content-type': 'text/html; charset=UTF-8' },
      });
    }

    return new Response('Not Found', { status: 404 });
  }
};
