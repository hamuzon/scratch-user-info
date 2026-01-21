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
        setError(data.error || '取得に失敗しました。');
      }
    } catch (error) {
      setError('通信エラーが発生しました。');
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
          background: #0f172a;
          background-image: radial-gradient(circle at 50% -20%, #1e293b, #0f172a);
          margin: 0;
          color: #f8fafc;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          line-height: 1.6;
        }
      `}</style>

      <style jsx>{`
        .layout-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          flex: 1;
          padding: 40px 15px;
          box-sizing: border-box;
        }

        .main-card {
          width: 100%;
          max-width: 640px;
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          box-sizing: border-box;
        }

        .title {
          font-size: 28px;
          font-weight: 800;
          text-align: center;
          margin-bottom: 32px;
          background: linear-gradient(to right, #00ffcc, #0ea5e9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .search-form {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 32px;
        }

        input {
          flex: 1;
          min-width: 240px;
          padding: 14px 18px;
          font-size: 16px;
          color: #fff;
          background: rgba(15, 23, 42, 0.6);
          border: 2px solid rgba(0, 255, 204, 0.2);
          border-radius: 12px;
          outline: none;
          transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        input:focus {
          border-color: #00ffcc;
          box-shadow: 0 0 0 4px rgba(0, 255, 204, 0.1);
        }

        .button-group {
          display: flex;
          gap: 10px;
          width: 100%;
        }

        .btn {
          flex: 1;
          padding: 14px;
          font-weight: 700;
          font-size: 15px;
          border-radius: 12px;
          cursor: pointer;
          border: none;
          transition: 0.2s;
        }

        .btn-fetch {
          background: #00ffcc;
          color: #0f172a;
        }

        .btn-fetch:hover {
          background: #33ffdd;
          transform: translateY(-1px);
        }

        .btn-reset {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .btn-reset:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .project-list {
          margin-top: 40px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .project-card {
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 20px;
          transition: 0.3s;
        }

        .project-card:hover {
          border-color: rgba(0, 255, 204, 0.3);
        }

        .thumb {
          width: 100%;
          border-radius: 12px;
          margin: 16px 0;
          display: block;
        }

        .footer {
          width: 100%;
          padding: 60px 20px 40px;
          text-align: center;
          box-sizing: border-box;
        }

        .footer-content {
          max-width: 600px;
          margin: 0 auto;
        }

        .copyright {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 12px;
          letter-spacing: 0.5px;
        }

        .disclaimer {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.3);
          line-height: 1.8;
        }

        @media (max-width: 640px) {
          .main-card {
            padding: 20px;
            border-radius: 16px;
          }
          
          .button-group {
            flex-direction: column;
          }
        }
      `}</style>

      <div className="layout-wrapper">
        <main className="main-card">
          <h1 className="title">Scratch User Info</h1>

          <form className="search-form" onSubmit={(e) => { e.preventDefault(); fetchUserInfo(); }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            
            <div className="button-group">
              <button type="submit" className="btn btn-fetch">取得する</button>
              <button type="button" onClick={reset} className="btn btn-reset">消去</button>
            </div>
          </form>

          {error && <p style={{ color: '#fb7185', textAlign: 'center', fontWeight: '600' }}>{error}</p>}

          {userInfo && (
            <div style={{ margin: '24px 0', padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ margin: '0', fontSize: '14px' }}>
                <strong style={{ color: '#00ffcc' }}>User:</strong> {userInfo.username}
              </p>
            </div>
          )}

          <div className="project-list">
            {projects.map((p) => (
              <div key={p.id} className="project-card">
                <h3 style={{ margin: '0', fontSize: '18px' }}>{p.title}</h3>
                
                <img
                  src={`https://cdn2.scratch.mit.edu/get_image/project/${p.id}_480x360.png`}
                  alt="thumbnail"
                  className="thumb"
                />

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => window.open(`https://scratch.mit.edu/projects/${p.id}`)} className="btn btn-fetch" style={{ fontSize: '12px', padding: '10px' }}>Scratch</button>
                  <button onClick={() => window.open(`https://turbowarp.org/${p.id}`)} className="btn btn-reset" style={{ fontSize: '12px', padding: '10px', background: '#f59e0b', color: '#000' }}>TurboWarp</button>
                </div>
              </div>
            ))}
          </div>
        </main>

        <footer className="footer">
          <div className="footer-content">
            <div className="copyright">
              &copy; 2024 &ndash; {currentYear} scratch-user-info
            </div>
            
            <div className="disclaimer">
              Scratchは、MITメディア・ラボのライフロング・キンダーガーテン・グループによって開発されたプロジェクトです。<br />
              本ツールは非公式のファンコンテンツであり、Scratch公式とは一切関係ありません。
            </div>
          </div>
        </footer>
      </div>

      <Analytics />
    </>
  );
}
