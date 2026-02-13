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

export default function Home() {
  const [username, setUsername] = useState('');
  const [projects, setProjects] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState('');

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

  const fetchUserInfo = async () => {
    setError('');
    setUserInfo(null);
    setProjects([]);

    if (!username) {
      setError('ユーザー名を入力してください。');
      return;
    }

    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();

      if (res.ok) {
        setUserInfo(data.user_info || null);
        setProjects(data.projects || []);
      } else {
        setError(data.error || 'ユーザー情報の取得に失敗しました。');
      }
    } catch (error) {
      console.error(error);
      setError('通信エラーが発生しました。');
    }
  };

  const reset = () => {
    setUsername('');
    setProjects([]);
    setUserInfo(null);
    setError('');
  };

  const renderTextWithLinks = (text) => {
    if (!text) {
      return '';
    }

    const parts = [];
    let lastIndex = 0;
    let match;

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
          <a key={`${matchStart}-url`} href={toHref(tokenText)} target="_blank" rel="noopener noreferrer" className="inline-link">
            {tokenText}
          </a>
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
          </a>
        );
      }

      lastIndex = matchEnd;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    TEXT_LINK_PATTERN.lastIndex = 0;

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
          font-family: 'Roboto', sans-serif;
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
          min-width: 200px;
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
        }

        .submit-button:hover {
          background: linear-gradient(135deg, #00ffff, #00ccaa);
        }

        .reset-button {
          background: linear-gradient(135deg, #ff4b5c, #d42e40);
        }

        .reset-button:hover {
          background: linear-gradient(135deg, #ff6f7c, #ff4b5c);
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

        .project-title a {
          font-size: 18px;
          font-weight: bold;
          color: inherit;
          text-decoration-line: underline;
          text-decoration-thickness: from-font;
          text-underline-offset: 3px;
          text-decoration-color: currentColor;
          display: block;
          margin-bottom: 5px;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .project-title a:visited {
          color: inherit;
        }

        .project-title a:hover,
        .project-title a:focus-visible,
        .project-title a:active {
          color: inherit;
          text-decoration-thickness: 2px;
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
        }

        .project-image-link {
          display: block;
          margin-top: 10px;
        }

        .username-link {
          color: inherit;
          text-decoration-line: underline;
          text-decoration-thickness: from-font;
          text-underline-offset: 2px;
          text-decoration-color: currentColor;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .username-link:visited {
          color: inherit;
        }

        .username-link:hover,
        .username-link:focus-visible,
        .username-link:active {
          color: inherit;
          text-decoration-thickness: 2px;
        }

        .info {
          font-size: 13px;
          color: #e0e0e0;
          margin-top: 10px;
          line-height: 1.5;
        }

        .profile-section {
          margin-top: 14px;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid rgba(0, 255, 204, 0.25);
          background: rgba(255, 255, 255, 0.06);
        }

        .profile-section strong {
          color: #00ffcc;
          display: block;
          margin-bottom: 6px;
        }

        .profile-section p {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .inline-link {
          color: inherit;
          text-decoration-line: underline;
          text-decoration-thickness: from-font;
          text-underline-offset: 3px;
          text-decoration-color: currentColor;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .inline-link:visited,
        .inline-link:hover,
        .inline-link:focus-visible,
        .inline-link:active {
          color: inherit;
          text-decoration-line: underline;
          text-decoration-color: currentColor;
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

        .usage, .description {
          margin-top: 15px;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid rgba(0, 255, 204, 0.2);
          background-color: rgba(255, 255, 255, 0.05);
          color: #fff;
          font-size: 13px;
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
        }
      `}</style>

      <main className="container">
        <h1 className="title">Scratchユーザー情報表示</h1>

        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            fetchUserInfo();
          }}
        >
          <input
            type="text"
            placeholder="ユーザー名またはURLを入力"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <div className="button-group">
            <button type="submit" className="submit-button">
              情報取得
            </button>

            <button type="button" onClick={reset} className="reset-button">
              リセット
            </button>
          </div>
        </form>

        {error && (
          <p style={{ color: '#ff4b5c', marginTop: 15, textAlign: 'center', fontSize: '14px' }}>
            {error}
          </p>
        )}

        {userInfo && (
          <div style={{ marginTop: 25, borderBottom: '1px solid rgba(0,255,204,0.2)', paddingBottom: '15px' }}>
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
                <p className="info"><strong>国:</strong> {userInfo.profile.country}</p>
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
              <p className="info"><strong>ScratchTeams:</strong> はい</p>
            )}
            {shouldShowMembership(userInfo) && (
              <p className="info"><strong>メンバーシップ / Membership:</strong> {getMembershipText(userInfo)}</p>
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
                  <a href={`https://scratch.mit.edu/projects/${project.id}`} target="_blank" rel="noopener noreferrer">
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
                  />
                </a>

                <p className="info">
                  <strong>ID:</strong> {project.id}<br />
                  <strong>共有:</strong> {project.published_date}<br />
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
                    <p style={{ margin: '5px 0 0 0', whiteSpace: 'pre-wrap' }}>{renderTextWithLinks(project.instructions)}</p>
                  </div>
                )}

                {project.description && (
                  <div className="description">
                    <strong>メモとクレジット:</strong>
                    <p style={{ margin: '5px 0 0 0', whiteSpace: 'pre-wrap' }}>{renderTextWithLinks(project.description)}</p>
                  </div>
                )}
              </div>
            ))}
        </div>
      </main>
    </>
  );
}
