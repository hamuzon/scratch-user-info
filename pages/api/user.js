// pages/api/user.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = await parseRequestBody(req, res);
  if (!body) {
    return;
  }

  const rawInput = String(body.username || '').trim();
  if (!rawInput) {
    return res.status(400).json({ error: 'username is required' });
  }

  try {
    const resolvedUsername = await resolveUsername(rawInput);
    if (!resolvedUsername) {
      return res.status(400).json({ error: 'username is required' });
    }

    const userRes = await fetch(`https://api.scratch.mit.edu/users/${encodeURIComponent(resolvedUsername)}`);
    if (!userRes.ok) {
      return res.status(404).json({ error: 'User not found' });
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

    return res.status(200).json({ user_info: userInfo, projects, resolved_username: resolvedUsername });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function parseRequestBody(req, res) {
  let body = req.body;

  if (body == null) {
    body = await readRawBody(req);
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      res.status(400).json({ error: 'Invalid JSON' });
      return null;
    }
  }

  if (body && typeof body === 'object') {
    return body;
  }

  return {};
}

async function readRawBody(req) {
  if (!req || typeof req.on !== 'function') {
    return '';
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
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


async function getProjectAuthorUsername(projectId) {
  const projectRes = await fetch(`https://api.scratch.mit.edu/projects/${projectId}`);
  if (!projectRes.ok) {
    return '';
  }

  const project = await projectRes.json();
  return project?.author?.username || '';
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
