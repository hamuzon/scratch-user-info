// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/next';

export default function Home() {
  const [username, setUsername] = useState('');
  const [projects, setProjects] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState('');
  const [year, setYear] = useState(2025);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const fetchUserInfo = async () => {
    setError('');
    setUserInfo(null);
    setProjects([]);
    setIsShaking(false);

    if (!username) {
      setError('ユーザー名を入力してください');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
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
        setError(data.error || '情報の取得に失敗しました');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    } catch (e) {
      setError('通信エラーが発生しました');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/icon.png" />
      </Head>

      <style jsx global>{`
        body {
          font-family: 'Inter', sans-serif;
          background: #020617;
          background-image: radial-gradient(circle at 50% 0%, #1e293b 0%, #020617 80%);
          margin: 0;
          color: #f8fafc;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          padding: 40px 15px;
          box-sizing: border-box;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }

        .shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>

      <style jsx>{`
        .container {
          width: 100%;
          max-width: 640px;
          background: rgba(30, 41, 59, 0.4);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 28px;
          padding: clamp(20px, 6vw, 40px);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          height: fit-content;
        }

        .title {
          font-size: clamp(22px, 5vw, 28px);
          font-weight: 800;
          text-align: center;
          margin-bottom: 30px;
          background: linear-gradient(to right, #00ffcc, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .input-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        input {
          width: 100%;
          padding: 16px 20px;
          font-size: 16px;
          color: #fff;
          background: rgba(15, 23, 42, 0.6);
          border: 2px solid rgba(0, 255, 204, 0.1);
          border-radius: 14px;
          box-sizing: border-box;
          outline: none;
          transition: 0.3s;
        }

        input:focus {
          border-color: #00ffcc;
          box-shadow: 0 0 15px rgba(0, 255, 204, 0.2);
        }

        .actions {
          display: flex;
          gap: 10px;
        }

        .btn {
          flex: 1;
          padding: 14px;
          font-weight: 700;
          border-radius: 12px;
          cursor: pointer;
          border: none;
          transition: 0.2s;
        }

        .btn-primary { background: #00ffcc; color: #020617; }
        .btn-primary:hover { transform: scale(1.02); background: #33ffdd; }
        
        .btn-secondary { background: rgba(255, 255, 255, 0.05); color: #fff; }
        .btn-secondary:hover { background: rgba(255, 255, 255, 0.1); }

        .error-msg {
          color: #fb7185;
          text-align: center;
          font-size: 14px;
          margin-top: 15px;
        }

        .card-list {
          margin-top: 40px;
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .project-card {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 20px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .thumb {
          width: 100%;
          border-radius: 12px;
          margin: 15px 0;
          display: block;
        }

        .footer {
          margin-top: 50px;
          text-align: center;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.3);
          line-height: 1.8;
        }

        @media (max-width: 480px) {
          .actions { flex-direction: column; }
        }
      `}</style>

      <main className={`container ${isShaking ? 'shake' : ''}`}>
        <h1 className="title">Scratch Viewer</h1>

        <form className="input-form" onSubmit={(e) => { e.preventDefault(); fetchUserInfo(); }}>
          <input
            type="text"
            placeholder="ユーザー名を入力"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <div className="actions">
            <button type="submit" className="btn btn-primary">情報を取得</button>
            <button type="button" onClick={reset} className="btn btn-secondary">リセット</button>
          </div>
        </form>

        {error && <div className="error-msg">{error}</div>}

        <div className="card-list">
          {projects.map((p) => (
            <div key={p.id} className="project-card">
              <h3 style={{ margin: 0, fontSize: '18px', color: '#00ffcc' }}>{p.title}</h3>
              <img
                src={`https://cdn2.scratch.mit.edu/get_image/project/${p.id}_480x360.png`}
                className="thumb"
                alt="preview"
              />
              <div className="actions">
                <button onClick={() => window.open(`https://scratch.mit.edu/projects/${p.id}`)} className="btn btn-primary" style={{fontSize: '13px'}}>Scratch</button>
                <button onClick={() => window.open(`https://turbowarp.org/${p.id}`)} className="btn btn-secondary" style={{fontSize: '13px', background: '#f59e0b', color: '#000'}}>TurboWarp</button>
              </div>
            </div>
          ))}
        </div>

        <footer className="footer">
          <p>&copy; 2024 - {year} scratch-user-info</p>
          <p>Not affiliated with Scratch or MIT.</p>
        </footer>
      </main>

      <Analytics />
    </>
  );
}
