const jsonHeaders = {
  'content-type': 'application/json; charset=UTF-8',
  'cache-control': 'no-store',
};

const htmlHeaders = {
  'content-type': 'text/html; charset=UTF-8',
  'cache-control': 'no-store',
};

function renderHome() {
  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Scratchユーザー情報表示 (Worker API)</title>
  </head>
  <body>
    <h1>Scratchユーザー情報表示</h1>
    <p>Cloudflare Worker 版の API エンドポイントです。</p>
    <p><code>POST /api/user</code> に <code>{"username":"..."}</code> を送信してください。</p>
  </body>
</html>`;
}

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

async function getProjectAuthorUsername(projectId) {
  const response = await fetch(`https://api.scratch.mit.edu/projects/${projectId}`);
  if (!response.ok) {
    return '';
  }

  const project = await response.json();
  return project?.author?.username || '';
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

  const userRes = await fetch(`https://api.scratch.mit.edu/users/${encodeURIComponent(resolvedUsername)}`);
  if (!userRes.ok) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: jsonHeaders });
  }

  const projectsRes = await fetch(`https://api.scratch.mit.edu/users/${encodeURIComponent(resolvedUsername)}/projects`);
  let projects = [];
  if (projectsRes.ok) {
    projects = await projectsRes.json();
    projects = projects.map((project) => ({
      ...project,
      published_date: formatDatetime(project.history?.shared),
      modified_date: formatDatetime(project.history?.modified),
    }));
  }

  const userInfo = await userRes.json();
  return new Response(JSON.stringify({ user_info: userInfo, projects, resolved_username: resolvedUsername }), {
    status: 200,
    headers: jsonHeaders,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/user') {
      return handleApiRequest(request);
    }

    if (env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) {
        return assetResponse;
      }
    }

    if (url.pathname === '/' || url.pathname === '') {
      return new Response(renderHome(), { status: 200, headers: htmlHeaders });
    }

    return new Response('Not Found', { status: 404 });
  },
};
