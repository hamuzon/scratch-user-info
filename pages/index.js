// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/next';

export default function Home() {
  const [username, setUsername] = useState('');
  const [projects, setProjects] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState('');
  const [currentYear, setCurrentYear] = useState(2025);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const startYear = 2024;

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
        setError(data.error || '情報の取得に失敗しました。');
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
        <title>Scratch Profile Viewer</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <style jsx global>{`
        body {
          font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', sans-serif;
          background: #050a0f;
          background-image: 
            radial-gradient(at 0% 0%, rgba(0, 255, 204, 0.05) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(0, 153, 255, 0.05) 0px, transparent 50%);
          margin: 0;
          color: #e0e0e0;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
      `}</style>

      <style jsx>{`
        .header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(5, 10, 15, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 15px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 1.2rem;
          color: #00ffcc;
          letter-spacing: 2px;
          font-weight: 800;
        }
        .container {
          flex: 1;
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          box-sizing: border-box;
        }
        .search-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        input {
          width: 100%;
          padding: 15px;
          border-radius: 12px;
          border: 1px solid rgba(0, 255, 204, 0.3);
          background: rgba(0, 0, 0, 0.2);
          color: #fff;
          font-size: 16px;
          box-sizing: border-box;
          transition: 0.3s;
        }
        input:focus {
          outline: none;
          border-color: #00ffcc;
          box-shadow: 0 0 10px rgba(0, 255, 204, 0.2);
        }
        .button-row {
          display: flex;
          gap: 10px;
        }
        .btn {
          flex: 1;
          padding: 12px;
          border-radius: 10px;
          font-weight: bold;
          cursor: pointer;
          border: none;
          transition: 0.2s;
        }
        .btn-primary { background: #00ffcc; color: #050a0f; }
        .btn-secondary { background: rgba(255, 255, 255, 0.1); color: #fff; }
        .btn:active { transform: scale(0.98); }

        .project-card {
          background: #111;
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 20px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .project-thumb {
          width: 100%;
          aspect-ratio: 4 / 3;
          object-fit: cover;
          display: block;
        }
        .project-info {
          padding: 15px;
        }
        .project-title {
          font-size: 16px;
          font-weight: bold;
          margin: 0 0 10px 0;
          color: #00ffcc;
        }
        .project-meta {
          font-size: 12px;
          color: #888;
          margin-bottom: 15px;
        }

        .footer {
          padding: 40px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        .footer-copy {
          color: #999;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .scratch-disclaimer {
          max-width: 400px;
          margin: 0 auto;
          line-height: 1.6;
        }

        @media (max-width: 480px) {
          .container { padding: 15px; }
          .header h1 { font-size: 1rem; }
        }
      `}</style>

      <header className="header">
        <h1>SCRATCH VIEWER 2025</h1>
      </header>

      <main className="container">
        <div className="search-card">
          <form onSubmit={(e) => { e.preventDefault(); fetchUserInfo(); }} className="input-group">
            <input
              type="text"
              placeholder="Scratch ユーザー名を入力"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <div className="button-row">
              <button type="submit" className="btn btn-primary">取得</button>
              <button type="button" onClick={reset} className="btn btn-secondary">リセット</button>
            </div>
          </form>
        </div>

        {error && <div style={{ color: '#ff6b6b', textAlign: 'center', marginBottom: '20px' }}>{error}</div>}

        {projects.map((p) => (
          <div key={p.id} className="project-card">
            <img 
              src={`https://cdn2.scratch.mit.edu/get_image/project/${p.id}_480x360.png`} 
              className="project-thumb" 
              alt={p.title}
            />
            <div className="project-info">
              <h3 className="project-title">{p.title}</h3>
              <p className="project-meta">ID: {p.id} | 更新: {p.modified_date}</p>
              <div className="button-row">
                <button onClick={() => window.open(`https://scratch.mit.edu/projects/${p.id}`)} className="btn btn-primary" style={{fontSize: '12px'}}>Scratchで見る</button>
                <button onClick={() => window.open(`https://turbowarp.org/${p.id}`)} className="btn btn-secondary" style={{fontSize: '12px', background: '#ff8c00'}}>TurboWarp</button>
              </div>
            </div>
          </div>
        ))}
      </main>

      <footer className="footer">
        <div className="footer-copy">
          &copy; {startYear} &ndash; {currentYear} Scratch Profile Viewer
        </div>
        <div className="scratch-disclaimer">
          <p>
            Scratchは、MITメディア・ラボのライフロング・キンダーガーテン・グループによって開発されたプロジェクトです。
            <br />
            本サイトは有志による制作であり、MITおよびScratch運営チームとは一切関係ありません。
          </p>
        </div>
      </footer>

      <Analytics />
    </>
  );
}
