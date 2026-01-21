// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Analytics } from '@vercelanalytics/next';

export default function Home() {
  const [username, setUsername] = useState('');
  const [projects, setProjects] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState('');
  const [currentYear, setCurrentYear] = useState(2025);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const fetchUserInfo = async () => {
    setError('');
    setUserInfo(null);
    setProjects([]);

    if (!username) {
      setError('ユーザー名を入力してください');
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
        setError(data.error || 'データの取得に失敗しました');
      }
    } catch (error) {
      setError('通信エラーが発生しました');
    }
  };

  const reset = () => {
    setUsername('');
    setProjects([]);
    setUserInfo(null);
    setError('');
  };

  return (
    <>
      <Head>
        <title>Scratch User Info Viewer</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/icon.png" />
      </Head>

      <style jsx global>{`
        body {
          font-family: 'Inter', -apple-system, sans-serif;
          background: #020617;
          background-image: radial-gradient(at 50% 0%, #1e293b 0%, #020617 70%);
          margin: 0;
          color: #f1f5f9;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
      `}</style>

      <style jsx>{`
        .layout {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 60px 20px;
          box-sizing: border-box;
        }

        .container {
          width: 100%;
          max-width: 680px;
          background: rgba(30, 41, 59, 0.5);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 32px;
          padding: 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          box-sizing: border-box;
        }

        .title {
          font-size: clamp(24px, 5vw, 32px);
          font-weight: 900;
          text-align: center;
          margin-bottom: 40px;
          background: linear-gradient(135deg, #00ffcc, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .search-area {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 40px;
        }

        input {
          width: 100%;
          padding: 18px 24px;
          font-size: 16px;
          color: #fff;
          background: rgba(15, 23, 42, 0.8);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          box-sizing: border-box;
          outline: none;
          transition: 0.3s;
        }

        input:focus {
          border-color: #00ffcc;
          box-shadow: 0 0 20px rgba(0, 255, 204, 0.15);
        }

        .actions {
          display: flex;
          gap: 12px;
        }

        .btn {
          flex: 1;
          padding: 16px;
          font-weight: 800;
          font-size: 15px;
          border-radius: 14px;
          cursor: pointer;
          border: none;
          transition: 0.3s;
        }

        .btn-main {
          background: #00ffcc;
          color: #020617;
        }

        .btn-main:hover {
          background: #33ffdd;
          transform: translateY(-2px);
        }

        .btn-alt {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }

        .btn-alt:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .project-grid {
          margin-top: 40px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .card {
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 24px;
          transition: 0.3s;
        }

        .thumb {
          width: 100%;
          aspect-ratio: 4/3;
          object-fit: cover;
          border-radius: 16px;
          margin: 20px 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer {
          width: 100%;
          padding: 80px 20px 40px;
          text-align: center;
          box-sizing: border-box;
        }

        .copyright {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 12px;
        }

        .disclaimer {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.25);
          line-height: 1.8;
          max-width: 500px;
          margin: 0 auto;
        }

        @media (max-width: 600px) {
          .container { padding: 24px; }
          .actions { flex-direction: column; }
          .layout { padding: 40px 12px; }
        }
      `}</style>

      <div className="layout">
        <main className="container">
          <h1 className="title">Scratch Profile Viewer</h1>

          <form className="search-area" onSubmit={(e) => { e.preventDefault(); fetchUserInfo(); }}>
            <input
              type="text"
              placeholder="ユーザー名を入力..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <div className="actions">
              <button type="submit" className="btn btn-main">情報を取得</button>
              <button type="button" onClick={reset} className="btn btn-alt">リセット</button>
            </div>
          </form>

          {error && <p style={{ color: '#fb7185', textAlign: 'center', fontWeight: 'bold' }}>{error}</p>}

          <div className="project-grid">
            {projects.map((p) => (
              <div key={p.id} className="card">
                <h3 style={{ margin: '0', fontSize: '18px', color: '#00ffcc' }}>{p.title}</h3>
                
                <img
                  src={`https://cdn2.scratch.mit.edu/get_image/project/${p.id}_480x360.png`}
                  alt="thumbnail"
                  className="thumb"
                />

                <div className="actions">
                  <button onClick={() => window.open(`https://scratch.mit.edu/projects/${p.id}`)} className="btn btn-main" style={{ padding: '10px', fontSize: '13px' }}>Scratch</button>
                  <button onClick={() => window.open(`https://turbowarp.org/${p.id}`)} className="btn btn-alt" style={{ padding: '10px', fontSize: '13px', background: '#f59e0b', color: '#000' }}>TurboWarp</button>
                </div>
              </div>
            ))}
          </div>
        </main>

        <footer className="footer">
          <div className="copyright">
            &copy; 2024 &ndash; {currentYear} scratch-user-info
          </div>
          <p className="disclaimer">
            ScratchはMITメディア・ラボのライフロング・キンダーガーテン・グループが開発したプロジェクトです。<br />
            本サイトは非公式ツールであり、Scratch公式とは一切関係ありません。
          </p>
        </footer>
      </div>

      <Analytics />
    </>
  );
}

