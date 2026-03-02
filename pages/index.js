// pages/index.js
import { useState } from 'react';
import Head from 'next/head';

const TEXT_LINK_PATTERN = /((?:https?:\/\/|www\.)[^\s]+|(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}(?:\/[^\s]*)?)|@([A-Za-z0-9_-]+)/g;
const TRAILING_PUNCTUATION_PATTERN = /[),.!?;:]+$/;

const toHref = (value) => {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return `https://${value}`;
};

const formatJoinedDate = (joined) => {
  if (!joined) {
    return { short: '不明', detail: '不明' };
  }

  const date = new Date(joined);
  return {
    short: date.toLocaleDateString('ja-JP'),
    detail: date.toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  };
};

const normalizeMembershipValue = (value) => {
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized) {
      return '';
    }

    const lowered = normalized.toLowerCase();
    if (['0', 'false', 'none', 'null', 'undefined', 'new scratcher'].includes(lowered)) {
      return '';
    }

    return normalized;
  }

  if (typeof value === 'number') {
    if (value <= 0) {
      return '';
    }
    return value === 1 ? 'Scratcher' : `Membership ${value}`;
  }

  if (typeof value === 'boolean') {
    return value ? 'Scratcher' : '';
  }

  if (value && typeof value === 'object') {
    return (
      normalizeMembershipValue(value.label) ||
      normalizeMembershipValue(value.name) ||
      normalizeMembershipValue(value.text) ||
      ''
    );
  }

  return '';
};

const getMembershipText = (user) => {
  const candidates = [
    user?.membership_label,
    user?.membership_avatar_badge,
    user?.profile?.membership_label,
    user?.profile?.membership_avatar_badge,
  ];

  for (const candidate of candidates) {
    const parsed = normalizeMembershipValue(candidate);
    if (parsed) {
      return parsed;
    }
  }

  return '';
};

const shouldShowMembership = (user) => Boolean(getMembershipText(user));

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
  const projectRes = await fetch(`https://api.scratch.mit.edu/projects/${projectId}`);
  if (!projectRes.ok) {
    return '';
  }

  const project = await projectRes.json();
  return project?.author?.username || '';
}

async function resolveUsername(input) {
  const trimmed = input.trim();
  const normalized = trimmed.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/^\/+/, '');

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

async function fetchScratchUserData(rawInput) {
  const resolvedUsername = await resolveUsername(rawInput);
  if (!resolvedUsername) {
    throw new Error('ユーザー名またはURLの形式が正しくありません。');
  }

  const encodedUsername = encodeURIComponent(resolvedUsername);
  const [userRes, projectsRes] = await Promise.all([
    fetch(`https://api.scratch.mit.edu/users/${encodedUsername}`),
    fetch(`https://api.scratch.mit.edu/users/${encodedUsername}/projects`),
  ]);

  if (!userRes.ok) {
    throw new Error('ユーザーが見つかりませんでした。');
  }

  const userInfo = await userRes.json();
  let projects = [];

  if (projectsRes.ok) {
    const rawProjects = await projectsRes.json();
    projects = rawProjects.map((project) => ({
      ...project,
      published_date: formatDatetime(project.history?.shared),
      modified_date: formatDatetime(project.history?.modified),
    }));
  }

  return { userInfo, projects };
}

export default function Home() {
  const [username, setUsername] = useState('');
  const [projects, setProjects] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchUserInfo = async (e) => {
    e.preventDefault();
    setError('');
    setUserInfo(null);
    setProjects([]);
    setLoading(true);

    if (!username) {
      setError('ユーザー名を入力してください。');
      setLoading(false);
      return;
    }

    try {
      const data = await fetchScratchUserData(username);
      setUserInfo(data.userInfo || null);
      setProjects(data.projects || []);
    } catch (requestError) {
      console.error(requestError);
      setError(requestError?.message || 'ユーザー情報の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setUsername('');
    setProjects([]);
    setUserInfo(null);
    setError('');
    setLoading(false);
  };

  const renderTextWithLinks = (text) => {
    if (!text) {
      return null;
    }

    const parts = [];
    let lastIndex = 0;
    let match;
    TEXT_LINK_PATTERN.lastIndex = 0;

    while ((match = TEXT_LINK_PATTERN.exec(text)) !== null) {
      const matchText = match[0];
      const matchStart = match.index;
      let matchEnd = matchStart + matchText.length;
      let trailing = '';
      let tokenText = matchText;

      if (match[1]) {
        const trailingMatch = matchText.match(TRAILING_PUNCTUATION_PATTERN);
        if (trailingMatch?.[0]) {
          trailing = trailingMatch[0];
          tokenText = matchText.slice(0, -trailing.length);
          matchEnd -= trailing.length;
        }
      }

      if (matchStart > lastIndex) {
        parts.push(text.slice(lastIndex, matchStart));
      }

      if (match[1]) {
        parts.push(
          <a
            key={`${matchStart}-link`}
            href={toHref(tokenText)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-link"
          >
            {tokenText}
          </a>,
        );

        if (trailing) {
          parts.push(trailing);
        }
      } else if (match[2]) {
        const mention = match[2];
        parts.push(
          <a
            key={`${matchStart}-mention`}
            href={`https://scratch.mit.edu/users/${encodeURIComponent(mention)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-link"
          >
            @{mention}
          </a>,
        );
      }

      lastIndex = matchEnd;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  return (
    <>
      <Head>
        <title>Scratchユーザー情報表示</title>
        <link rel="icon" href="/icon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <style jsx global>{`
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
          margin: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          color: #fff;
          padding: 15px;
          box-sizing: border-box;
        }
      `}</style>

      <style jsx>{`
        .container {
          width: 100%;
          max-width: 600px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(10px);
          padding: 20px;
          margin: 20px auto;
          box-sizing: border-box;
        }

        .title {
          font-size: 24px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 8px;
          color: #00ffcc;
        }

        .form {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        input {
          flex: 1;
          min-width: 0;
          width: 100%;
          padding: 12px;
          font-size: 16px;
          color: #fff;
          border: 1px solid #00ffcc;
          border-radius: 8px;
          background-color: transparent;
          outline: none;
          transition: all 0.3s;
          box-sizing: border-box;
        }

        input:focus {
          border-color: #00ffff;
          box-shadow: 0 0 8px #00ffff;
        }

        .button-group {
          display: flex;
          gap: 10px;
          flex-shrink: 0;
        }

        button {
          min-height: 42px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: bold;
          color: #fff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
          white-space: nowrap;
        }

        .submit-button {
          background: linear-gradient(135deg, #00ffcc, #009999);
          min-width: 96px;
        }

        .submit-button:hover {
          background: linear-gradient(135deg, #00ffff, #00ccaa);
        }

        .reset-button {
          background: linear-gradient(135deg, #ff4b5c, #d42e40);
          min-width: 96px;
        }

        .reset-button:hover {
          background: linear-gradient(135deg, #ff6f7c, #ff4b5c);
        }

        .status-area {
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 10px;
        }

        .results {
          margin-top: 10px;
          min-height: 140px;
        }

        .project {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(0, 255, 204, 0.3);
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 20px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
          word-wrap: break-word;
          overflow: hidden;
        }

        a,
        a:-webkit-any-link {
          color: #fff;
          text-decoration: underline;
          text-underline-offset: 4px;
          text-decoration-color: #fff;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        a:visited,
        a:hover,
        a:active {
          color: #fff;
          text-decoration-color: #fff;
        }

        .project-title a,
        .project-title a:-webkit-any-link {
          font-size: 18px;
          font-weight: bold;
          display: block;
          margin-bottom: 5px;
          color: #fff;
        }

        .project-title a:visited,
        .project-title a:hover,
        .project-title a:active {
          color: #fff;
        }

        .inline-link,
        .username-link,
        .inline-link:-webkit-any-link,
        .username-link:-webkit-any-link {
          color: #fff;
          text-decoration: underline;
          text-underline-offset: 4px;
        }

        .inline-link:visited,
        .inline-link:hover,
        .inline-link:active,
        .username-link:visited,
        .username-link:hover,
        .username-link:active {
          color: #fff;
          text-decoration-color: #fff;
        }

        a:-webkit-any-link {
          color: #fff;
        }

        .project-image {
          width: 100%;
          height: auto;
          aspect-ratio: 4 / 3;
          object-fit: cover;
          border-radius: 8px;
          border: 2px solid #00ffcc;
          margin-top: 10px;
          display: block;
          background: rgba(255, 255, 255, 0.08);
        }

        .project-image-link {
          display: block;
          margin-top: 10px;
          text-decoration: none;
        }

        .info {
          font-size: 14px;
          color: #e0e0e0;
          margin-top: 10px;
          line-height: 1.7;
        }

        .profile-section {
          margin-top: 14px;
          padding: 15px;
          border-radius: 10px;
          border: 1px solid rgba(0, 255, 204, 0.25);
          background: rgba(255, 255, 255, 0.06);
        }

        .profile-section strong {
          color: #00ffcc;
          display: block;
          margin-bottom: 8px;
        }

        .profile-section p {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
          line-height: 1.7;
        }

        .meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
        }

        .meta-row .info {
          margin-top: 10px;
        }

        .usage,
        .description {
          margin-top: 15px;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid rgba(0, 255, 204, 0.2);
          background-color: rgba(255, 255, 255, 0.05);
          color: #fff;
          font-size: 14px;
        }

        .usage p,
        .description p {
          margin: 5px 0 0 0;
          white-space: pre-wrap;
          word-break: break-word;
          line-height: 1.7;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }

        .action-buttons button {
          flex: 1;
          text-align: center;
        }

        .scratch-button {
          background: linear-gradient(135deg, #00ffcc, #009999);
        }

        .turbowarp-button {
          background: linear-gradient(135deg, #ff9800, #ff5722);
        }

        @media (max-width: 500px) {
          .container {
            padding: 15px;
            margin: 10px auto;
          }

          .form {
            flex-direction: column;
            align-items: stretch;
          }

          .button-group {
            width: 100%;
          }

          .button-group button {
            flex: 1;
          }

          .title {
            font-size: 20px;
          }

          .project-title a {
            font-size: 16px;
          }

          .meta-row {
            gap: 8px;
          }

          .info {
            line-height: 1.6;
          }

          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>

      <main className="container">
        <h1 className="title">Scratchユーザー情報表示</h1>

        <form className="form" onSubmit={fetchUserInfo}>
          <input
            type="text"
            placeholder="ユーザー名またはURLを入力"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <div className="button-group">
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? '取得中...' : '情報取得'}
            </button>

            <button type="button" onClick={reset} className="reset-button">
              リセット
            </button>
          </div>
        </form>

        <div className="status-area" aria-live="polite">
          {error && <p style={{ color: '#ff4b5c', margin: 0, textAlign: 'center', fontSize: '14px' }}>{error}</p>}
          {!error && loading && (
            <p style={{ color: '#b9fff0', margin: 0, textAlign: 'center', fontSize: '14px' }}>ユーザー情報を取得中です...</p>
          )}
        </div>

        <div className="results">
          {userInfo && (
            <div style={{ marginTop: 10, borderBottom: '1px solid rgba(0,255,204,0.2)', paddingBottom: '15px' }}>
              <h2 style={{ fontSize: '17px', color: '#00ffcc', marginBottom: '8px' }}>ユーザー情報</h2>

              <p className="info">
                <strong>ユーザー名:</strong>{' '}
                <a
                  href={`https://scratch.mit.edu/users/${encodeURIComponent(userInfo.username)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="username-link"
                >
                  @{userInfo.username}
                </a>
              </p>

              <div className="meta-row">
                {userInfo.profile?.country && (
                  <p className="info">
                    <strong>国:</strong> {userInfo.profile.country}
                  </p>
                )}
                <p className="info">
                  <strong>登録日:</strong>{' '}
                  <time
                    title={`${formatJoinedDate(userInfo.history?.joined).detail}（ホバー/タップで詳細）`}
                    dateTime={userInfo.history?.joined || ''}
                  >
                    {formatJoinedDate(userInfo.history?.joined).short}
                  </time>
                </p>
              </div>

              {userInfo.scratchteam && (
                <p className="info">
                  <strong>ScratchTeams:</strong> はい
                </p>
              )}

              {shouldShowMembership(userInfo) && (
                <p className="info">
                  <strong>メンバーシップ / Membership:</strong> {getMembershipText(userInfo)}
                </p>
              )}

              {userInfo.profile?.bio && (
                <div className="profile-section">
                  <strong>私について / About me</strong>
                  <p>{renderTextWithLinks(userInfo.profile.bio)}</p>
                </div>
              )}

              {userInfo.profile?.status && (
                <div className="profile-section">
                  <strong>私が取り組んでいること / What I'm working on</strong>
                  <p>{renderTextWithLinks(userInfo.profile.status)}</p>
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: 25 }}>
            {projects.length > 0 &&
              projects.map((project) => (
                <div key={project.id} className="project">
                  <div className="project-title">
                    <a
                      href={`https://scratch.mit.edu/projects/${project.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {project.title}
                    </a>
                  </div>

                  <a
                    href={`https://scratch.mit.edu/projects/${project.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-image-link"
                  >
                    <img
                      src={`https://cdn2.scratch.mit.edu/get_image/project/${project.id}_480x360.png`}
                      alt={project.title}
                      className="project-image"
                      width="480"
                      height="360"
                      loading="lazy"
                      decoding="async"
                    />
                  </a>

                  <p className="info">
                    <strong>ID:</strong> {project.id}
                    <br />
                    <strong>共有:</strong> {project.published_date}
                    <br />
                    <strong>更新:</strong> {project.modified_date}
                  </p>

                  <div className="action-buttons">
                    <button
                      onClick={() => window.open(`https://scratch.mit.edu/projects/${project.id}`, '_blank')}
                      className="scratch-button"
                    >
                      Scratch
                    </button>

                    <button
                      onClick={() => window.open(`https://turbowarp.org/${project.id}`, '_blank')}
                      className="turbowarp-button"
                    >
                      TurboWarp
                    </button>
                  </div>

                  {project.instructions && (
                    <div className="usage">
                      <strong>使い方:</strong>
                      <p>{renderTextWithLinks(project.instructions)}</p>
                    </div>
                  )}

                  {project.description && (
                    <div className="description">
                      <strong>メモとクレジット:</strong>
                      <p>{renderTextWithLinks(project.description)}</p>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      </main>
    </>
  );
}
