// pages/api/user.js

const SCRATCH_API_BASE = 'https://api.scratch.mit.edu';
const PROJECT_LIMIT = 12;

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

    const encodedUsername = encodeURIComponent(resolvedUsername);
    const [userRes, projectsRes] = await Promise.all([
      fetch(`${SCRATCH_API_BASE}/users/${encodedUsername}`),
      fetch(`${SCRATCH_API_BASE}/users/${encodedUsername}/projects?limit=${PROJECT_LIMIT}`),
    ]);

    if (!userRes.ok) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [userInfo, rawProjects] = await Promise.all([
      userRes.json(),
      projectsRes.ok ? projectsRes.json() : Promise.resolve([]),
    ]);

    const projects = rawProjects.map((project) => ({
      id: project.id,
      title: project.title,
      instructions: project.instructions,
      description: project.description,
      published_date: formatDatetime(project.history?.shared),
      modified_date: formatDatetime(project.history?.modified),
    }));

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ user_info: userInfo, projects, resolved_username: resolvedUsername });
  } catch (error) {
    console.error('API Handler Error:', error);
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
      // It might be a project ID, let's check it in parallel with treating it as a username
      const [authorFromProject, candidateExists] = await Promise.all([
        getProjectAuthorUsername(candidate),
        fetch(`${SCRATCH_API_BASE}/users/${encodeURIComponent(candidate)}`).then(r => r.ok)
      ]);
      
      if (candidateExists) return candidate;
      return authorFromProject || candidate;
    }

    return candidate;
  }

  return '';
}

async function getProjectAuthorUsername(projectId) {
  const projectRes = await fetch(`${SCRATCH_API_BASE}/projects/${projectId}`);
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
