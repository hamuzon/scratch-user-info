// pages/index.js
import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

const TEXT_LINK_PATTERN = /((?:https?:\/\/|www\.)[^\s]+|(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}(?:\/[^\s]*)?)|@([A-Za-z0-9_-]+)/g;
const TRAILING_PUNCTUATION_PATTERN = /[),.!?;:]+$/;

const toHref = (value) => {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return `https://${value}`;
};

const PROJECT_LIMIT = 10;

const normalizeApiBaseUrl = (value) => {
  if (!value) {
    return '';
  }

  return value.replace(/\/+$/, '');
};

const API_BASE_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL || '');

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
    user?.profile?.membership_label,
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

const getAvatarBadgeValue = (user) => {
  const candidates = [
    user?.membership_avatar_badge,
    user?.profile?.membership_avatar_badge,
  ];

  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null) {
      return candidate;
    }
  }
  return null;
};

const getAvatarBadgeStatus = (user) => {
  const rawValue = getAvatarBadgeValue(user);
  if (rawValue === null || rawValue === undefined) return '';

  if (typeof rawValue === 'number') {
    return rawValue > 0 ? 'している' : '';
  }

  if (typeof rawValue === 'string') {
    const normalized = rawValue.trim().toLowerCase();
    if (!normalized || ['0', 'false', 'none', 'null', 'undefined', 'no'].includes(normalized)) {
      return '';
    }
    return rawValue;
  }

  if (typeof rawValue === 'boolean') {
    return rawValue ? 'している' : '';
  }

  if (rawValue && typeof rawValue === 'object') {
    return (
      getAvatarBadgeStatus({ membership_avatar_badge: rawValue.label }) ||
      getAvatarBadgeStatus({ membership_avatar_badge: rawValue.name }) ||
      getAvatarBadgeStatus({ membership_avatar_badge: rawValue.text }) ||
      ''
    );
  }

  return '';
};

const shouldShowAvatarBadge = (user) => Boolean(getAvatarBadgeStatus(user));

export default function Home() {
  const router = useRouter();
  const basePath = router.basePath || '';
  const [username, setUsername] = useState('');
  const [projects, setProjects] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [projectCount, setProjectCount] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const joinedDate = useMemo(() => formatJoinedDate(userInfo?.history?.joined), [userInfo?.history?.joined]);
  const totalPages = projectCount !== null ? Math.max(1, Math.ceil(projectCount / PROJECT_LIMIT)) : null;
  const hasMoreProjects = projects.length === PROJECT_LIMIT;
  const showPagination = totalPages ? totalPages > 1 : currentPage > 1 || hasMoreProjects;
  const canGoPrev = currentPage > 1;
  const canGoNext = totalPages !== null ? currentPage < totalPages : hasMoreProjects;
  const projectCountText = projectCount !== null ? `${projectCount}件` : (loading ? '取得中' : '不明');

  const ensureBrowserUrl = (targetUsername, pageNumber, method = 'push') => {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set('n', targetUsername);
    url.searchParams.delete('user');
    url.searchParams.delete('name');
    url.searchParams.delete('username');
    url.searchParams.delete('u');
    url.searchParams.delete('page');

    if (pageNumber > 1) {
      url.searchParams.set('p', String(pageNumber));
    } else {
      url.searchParams.delete('p');
    }

    const historyMethod = method === 'replace' ? 'replaceState' : 'pushState';
    window.history[historyMethod](window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  };

  const updateUrl = (targetUsername, pageNumber, method = 'push') => {
    if (!targetUsername || typeof window === 'undefined') {
      return;
    }

    ensureBrowserUrl(targetUsername, pageNumber, method);
  };

  const loadUserInfo = async (pageNumber = 1, usernameOverride = null, options = {}) => {
    setError('');
    setLoading(true);
    const targetUsername = usernameOverride || username;

    if (!targetUsername) {
      setError('ユーザー名を入力してください。');
      setLoading(false);
      return;
    }

    try {
      const apiPath = `${API_BASE_URL || router.basePath || ''}/api/user`;
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: targetUsername, page: pageNumber }),
      });
      const data = await res.json();

      if (res.ok) {
        setUserInfo(data.user_info || null);
        setProjects(data.projects || []);
        setProjectCount(data.project_count ?? null);
        setCurrentPage(data.current_page || pageNumber);
        if (options.syncUrl) {
          updateUrl(data.resolved_username || targetUsername, data.current_page || pageNumber, options.historyMethod || 'push');
        }
      } else {
        setError(data.error || 'ユーザー情報の取得に失敗しました。');
      }
    } catch (error) {
      console.error(error);
      setError('通信エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInfo = async (e) => {
    e.preventDefault();
    setUserInfo(null);
    setProjects([]);
    setProjectCount(null);
    setCurrentPage(1);
    await loadUserInfo(1, null, { syncUrl: true });
  };

  const getQueryParams = (query) => {
    const usernameKeys = ['n', 'user', 'name', 'username', 'u'];
    const pageKeys = ['p', 'page'];
    let parsedUsername = '';
    let parsedPage = 1;

    if (!query || typeof query !== 'object') {
      if (typeof window === 'undefined') {
        return { username: '', page: 1 };
      }
      query = Object.fromEntries(new URLSearchParams(window.location.search));
    }

    const lowerCaseQuery = Object.entries(query).reduce((acc, [key, value]) => {
      acc[key.toLowerCase()] = value;
      return acc;
    }, {});

    for (const key of usernameKeys) {
      const value = lowerCaseQuery[key];
      if (value) {
        const queryValue = Array.isArray(value) ? value[0] : value;
        const trimmed = String(queryValue).trim();
        if (trimmed) {
          parsedUsername = trimmed;
          break;
        }
      }
    }

    for (const key of pageKeys) {
      const value = lowerCaseQuery[key];
      if (value) {
        const queryValue = Array.isArray(value) ? value[0] : value;
        const parsed = Number(queryValue);
        if (!Number.isNaN(parsed) && parsed >= 1) {
          parsedPage = parsed;
          break;
        }
      }
    }

    return { username: parsedUsername, page: parsedPage };
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const { username: queryUsername, page: queryPage } = getQueryParams(
      Object.fromEntries(new URLSearchParams(window.location.search))
    );
    if (!queryUsername) {
      return;
    }

    if (queryUsername === username && currentPage === queryPage && (userInfo || projects.length > 0)) {
      return;
    }

    setUsername(queryUsername);
    setUserInfo(null);
    setProjects([]);
    setProjectCount(null);
    setCurrentPage(queryPage);
    loadUserInfo(queryPage, queryUsername, { syncUrl: true, historyMethod: 'replace' });
  }, []);

  const reset = () => {
    setUsername('');
    setProjects([]);
    setUserInfo(null);
    setProjectCount(null);
    setCurrentPage(1);
    setError('');
    setLoading(false);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('n');
      url.searchParams.delete('p');
      url.searchParams.delete('user');
      url.searchParams.delete('name');
      url.searchParams.delete('username');
      url.searchParams.delete('u');
      url.searchParams.delete('page');
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    }
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

    return parts;
  };

  return (
    <>
      <Head>
        <title>Scratchユーザー情報表示</title>
        <link rel="icon" href={`${basePath}/icon.png`} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta
          name="description"
          content="Scratchユーザー情報と公開プロジェクトをすばやく確認できるツールです。ユーザー名・プロフィール・作品情報を表示します。"
        />
        <link rel="preconnect" href="https://scratch.mit.edu" crossOrigin="" />
        <link rel="preconnect" href="https://cdn2.scratch.mit.edu" crossOrigin="" />
        <link rel="dns-prefetch" href="https://scratch.mit.edu" />
        <link rel="dns-prefetch" href="https://cdn2.scratch.mit.edu" />
      </Head>

      <style jsx global>{`
        :root {
          --link-color: #fff;
          --inline-link-color: #00ffcc;
        }

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

        a {
          color: #ffffff;
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

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
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
          transition: border-color 0.2s, box-shadow 0.2s;
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
          transition: background 0.2s;
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
          content-visibility: auto;
          contain-intrinsic-size: 320px;
        }

        /* 全体のリンク設定 */
        a,
        a:-webkit-any-link,
        a:any-link {
          color: var(--link-color);
          -webkit-text-fill-color: var(--link-color);
          text-decoration: underline;
          text-underline-offset: 4px;
          text-decoration-color: var(--link-color);
          overflow-wrap: anywhere;
          word-break: break-word;
          -webkit-tap-highlight-color: transparent;
        }

        a:visited,
        a:hover,
        a:active,
        a:focus,
        a:focus-visible {
          color: var(--link-color);
          -webkit-text-fill-color: var(--link-color);
          text-decoration-color: var(--link-color);
        }

        /* 個別のリンク設定 */
        .project-title a,
        .project-title a:-webkit-any-link {
          font-size: 18px;
          font-weight: bold;
          display: block;
          margin-bottom: 5px;
          color: var(--link-color);
          -webkit-text-fill-color: var(--link-color);
        }

        .project-title a:visited,
        .project-title a:hover,
        .project-title a:active {
          color: var(--link-color);
          -webkit-text-fill-color: var(--link-color);
        }

        /* 生成された URL / @メンションリンク */
        .inline-link,
        .username-link,
        .inline-link:-webkit-any-link,
        .username-link:-webkit-any-link {
          color: var(--inline-link-color);
          -webkit-text-fill-color: var(--inline-link-color);
          text-decoration: underline;
          text-underline-offset: 4px;
        }

        .inline-link:visited,
        .inline-link:hover,
        .inline-link:active,
        .username-link:visited,
        .username-link:hover,
        .username-link:active {
          color: var(--inline-link-color);
          -webkit-text-fill-color: var(--inline-link-color);
          text-decoration-color: var(--inline-link-color);
        }

        a:-webkit-any-link {
          color: var(--link-color);
          -webkit-text-fill-color: var(--link-color);
        }

        @media (prefers-reduced-motion: reduce) {
          input,
          button {
            transition: none;
          }
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

        .pagination-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-top: 18px;
          padding: 14px 16px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(0, 255, 204, 0.16);
          color: #e0f7fa;
          font-size: 14px;
        }

        .pagination-buttons {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          margin-top: 15px;
        }

        .pagination-buttons button {
          min-width: 100px;
          padding: 10px 14px;
          font-size: 14px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(0, 255, 204, 0.2);
          border-radius: 8px;
        }

        .pagination-buttons button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 900px), (pointer: coarse), (hover: none) {
          .container {
            backdrop-filter: none;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
          }

          .project {
            box-shadow: none;
          }
        }

        @media (prefers-reduced-data: reduce) {
          .container,
          .project {
            box-shadow: none;
            backdrop-filter: none;
          }
        }

        @media (max-width: 500px) {
          .container {
            padding: 15px;
            margin: 10px auto;
            backdrop-filter: none;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
            background-color: rgba(255, 255, 255, 0.14);
          }

          .project {
            box-shadow: none;
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

      <main id="main-content" className="container" role="main">
        <h1 className="title">Scratchユーザー情報表示</h1>

        <form className="form" onSubmit={fetchUserInfo}>
          <label htmlFor="username-input" className="sr-only">
            ユーザー名またはURL
          </label>
          <input
            id="username-input"
            name="username"
            type="text"
            placeholder="ユーザー名またはURLを入力"
            autoComplete="username"
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

            <p className="info">
              <strong>作品数:</strong> {projectCountText}
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
                  title={`${joinedDate.detail}（ホバー/タップで詳細）`}
                  dateTime={userInfo.history?.joined || ''}
                >
                  {joinedDate.short}
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

            {shouldShowAvatarBadge(userInfo) && (
              <p className="info">
                <strong>猫耳をアバターに表示してるか:</strong>{' '}
                {getAvatarBadgeStatus(userInfo) === 'している'
                  ? 'している'
                  : `している (${getAvatarBadgeStatus(userInfo)})`}
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
          {showPagination && (
            <>
              <div className="pagination-summary">
                <span>
                  <strong>作品数:</strong> {projectCountText}
                </span>
                <span>
                  <strong>ページ:</strong> {currentPage}
                  {totalPages ? ` / ${totalPages}` : ''}
                </span>
              </div>

              <div className="pagination-buttons">
                <button
                  type="button"
                  onClick={() => loadUserInfo(1, null, { syncUrl: true })}
                  disabled={loading || !canGoPrev}
                >
                  最初のページ
                </button>
                <button
                  type="button"
                  onClick={() => loadUserInfo(currentPage - 1, null, { syncUrl: true })}
                  disabled={loading || !canGoPrev}
                >
                  前のページ
                </button>
                <button
                  type="button"
                  onClick={() => loadUserInfo(currentPage + 1, null, { syncUrl: true })}
                  disabled={loading || !canGoNext}
                >
                  次のページ
                </button>
                {totalPages !== null && (
                  <button
                    type="button"
                    onClick={() => loadUserInfo(totalPages, null, { syncUrl: true })}
                    disabled={loading || !canGoNext}
                  >
                    最後のページ
                  </button>
                )}
              </div>
            </>
          )}

          {projects.length > 0 &&
            projects.map((project, index) => (
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
                    loading={index < 2 ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchPriority={index === 0 ? 'high' : 'low'}
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

          {showPagination && (
            <>
              <div className="pagination-summary">
                <span>
                  <strong>作品数:</strong> {projectCountText}
                </span>
                <span>
                  <strong>ページ:</strong> {currentPage}
                  {totalPages ? ` / ${totalPages}` : ''}
                </span>
              </div>

              <div className="pagination-buttons">
                <button
                  type="button"
                  onClick={() => loadUserInfo(1, null, { syncUrl: true })}
                  disabled={loading || !canGoPrev}
                >
                  最初のページ
                </button>
                <button
                  type="button"
                  onClick={() => loadUserInfo(currentPage - 1, null, { syncUrl: true })}
                  disabled={loading || !canGoPrev}
                >
                  前のページ
                </button>
                <button
                  type="button"
                  onClick={() => loadUserInfo(currentPage + 1, null, { syncUrl: true })}
                  disabled={loading || !canGoNext}
                >
                  次のページ
                </button>
                {totalPages !== null && (
                  <button
                    type="button"
                    onClick={() => loadUserInfo(totalPages, null, { syncUrl: true })}
                    disabled={loading || !canGoNext}
                  >
                    最後のページ
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
