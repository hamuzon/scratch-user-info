// pages/index.js
import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import ProjectCard, { renderTextWithLinks } from '../components/ProjectCard';
import { formatJoinedDate, getMembershipText, shouldShowMembership } from '../utils/scratch';

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [projects, setProjects] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const joinedDate = useMemo(() => formatJoinedDate(userInfo?.history?.joined), [userInfo?.history?.joined]);

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
      const apiPath = `${router.basePath || ''}/api/user`;
      const res = await fetch(apiPath, {
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

  return (
    <Layout>
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

        @media (max-width: 900px), (pointer: coarse), (hover: none) {
          .container {
            backdrop-filter: none;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
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
              <ProjectCard key={project.id} project={project} />
            ))}
        </div>
      </main>
    </Layout>
  );
}
