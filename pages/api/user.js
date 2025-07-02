// pages/api/user.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  // If body is a string (not parsed), try to parse it
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }

  const username = body.username;
  if (!username) {
    return res.status(400).json({ error: 'username is required' });
  }

  try {
    const userRes = await fetch(`https://api.scratch.mit.edu/users/${username}`);
    if (!userRes.ok) {
      return res.status(404).json({ error: 'User not found' });
    }

    const projectsRes = await fetch(`https://api.scratch.mit.edu/users/${username}/projects`);
    let projects = [];
    if (projectsRes.ok) {
      projects = await projectsRes.json();
      projects = projects.map(project => ({
        ...project,
        published_date: formatDatetime(project.history?.created),
        modified_date: formatDatetime(project.history?.modified),
      }));
    }

    const userInfo = await userRes.json();

    return res.status(200).json({ user_info: userInfo, projects });
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
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

