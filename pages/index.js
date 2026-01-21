// pages/index.js
import { useState } from 'react';
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/next';

export default function Home() {
  const [username, setUsername] = useState('');
  const [projects, setProjects] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState('');

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

  return (
    <>
      <Head>
        <title>Scratchユーザー情報表示</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/icon.png" />
      </Head>

      <style jsx global>{`
        body {
          font-family: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
          background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
          margin: 0;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          min-height: 100vh;
          color: #fff;
          padding: 20px 10px;
          box-sizing: border-box;
        }
      `}</style>

      <style jsx>{`
        .container {
          width: 95%;
          max-width: 650px;
          background-color: rgba(255, 255, 255, 0.08);
          border-radius: 15px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding: 20px;
          margin: 20px auto;
        }

        .title {
          font-size: 1.6rem;
          font-weight: bold;
          text-align: center;
          margin-bottom: 25px;
          color: #00ffcc;
          letter-spacing: 1px;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        input {
          width: 100%;
          padding: 14px;
          font-size: 16px;
          color: #fff;
          border: 1px solid #00ffcc;
          border-radius: 10px;
          background-color: rgba(255, 255, 255, 0.05);
          outline: none;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        input:focus {
          border-color: #00ffff;
          box-shadow: 0 0 12px rgba(0, 255, 255, 0.4);
          background-color: rgba(255, 255, 255, 0.1);
        }

        .button-group {
          display: flex;
          gap: 10px;
        }

        button {
          flex: 1;
          padding: 14px;
          font-size: 14px;
          font-weight: bold;
          color: #fff;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: transform 0.1s, opacity 0.3s;
        }

        button:active {
          transform: scale(0.96);
        }

        .submit-button {
          background: linear-gradient(135deg, #00ffcc, #009999);
        }

        .reset-button {
          background: linear-gradient(135deg, #ff4b5c, #d42e40);
        }

        .user-card {
          margin-top: 30px;
          padding: 18px;
          background: rgba(0, 255, 204, 0.08);
          border-radius: 12px;
          border-left: 5px solid #00ffcc;
        }

        .user-card h2 {
          font-size: 1.2rem;
          margin: 0 0 10px 0;
          color: #00ffcc;
        }

        .project {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(0, 255, 204, 0.2);
          border-radius: 15px;
          padding: 20px;
          margin-top: 25px;
        }

        .project-title {
          margin: 0 0 15px 0;
          font-size: 1.15rem;
          line-height: 1.4;
        }

        .project-title a {
          color: #00ffcc;
          text-decoration: none;
        }

        .project-image {
          width: 100%;
          height: auto;
          border-radius: 10px;
          display: block;
          margin-bottom: 15px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          font-size: 13.5px;
          color: #e0e0e0;
        }

        .info-item b {
          color: #00ffcc;
          margin-right: 5px;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin: 20px 0;
        }

        .text-box {
          font-size: 13px;
          padding: 12px;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.25);
          margin-top: 12px;
          white-space: pre-wrap;
          word-break: break-word;
          line-height: 1.6;
          border: 1px solid rgba(0, 255, 204, 0.1);
        }

        .text-box strong {
          display: block;
          margin-bottom: 6px;
          color: #00ffcc;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        @media (min-width: 600px) {
          .form {
            flex-direction: row;
            align-items: flex-start;
          }

          .button-group {
            flex: 0 0 200px;
          }

          .info-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      <main className="container">
        <h1 className="title">Scratch Explorer</h1>

        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            fetchUserInfo();
          }}
        >
          <input
            type="text"
            placeholder="ユーザー名を入力"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <div className="button-group">
            <button type="submit" className="submit-button">
              取得
            </button>
            <button type="button" onClick={reset} className="reset-button">
              リセット
            </button>
          </div>
        </form>

        {error && (
          <p style={{ color: '#ff4b5c', textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
            {error}
          </p>
        )}

        {userInfo && (
          <section className="user-card">
            <h2>User Profile</h2>
            <div className="info-grid">
              <div className="info-item">
                <b>ユーザー名:</b> {userInfo.username}
              </div>
              <div className="info-item">
                <b>登録日:</b> {userInfo.history?.joined ? new Date(userInfo.history.joined).toLocaleDateString('ja-JP') : '不明'}
              </div>
            </div>
          </section>
        )}

        <div className="project-list">
          {projects.map((project) => (
            <article key={project.id} className="project">
              <h3 className="project-title">
                <a href={`https://scratch.mit.edu/projects/${project.id}`} target="_blank" rel="noopener noreferrer">
                  {project.title}
                </a>
              </h3>

              <img
                src={`https://cdn2.scratch.mit.edu/get_image/project/${project.id}_480x360.png`}
                alt={project.title}
                className="project-image"
                loading="lazy"
              />

              <div className="info-grid">
                <div className="info-item">
                  <b>Project ID:</b> {project.id}
                </div>
                <div className="info-item">
                  <b>公開日:</b> {project.published_date}
                </div>
              </div>

              <div className="action-buttons">
                <button
                  onClick={() => window.open(`https://scratch.mit.edu/projects/${project.id}`, '_blank')}
                  className="submit-button"
                >
                  Scratch
                </button>
                <button
                  onClick={() => window.open(`https://turbowarp.org/${project.id}`, '_blank')}
                  style={{ background: 'linear-gradient(135deg, #ff9800, #ff5722)' }}
                >
                  TurboWarp
                </button>
              </div>

              {project.instructions && (
                <div className="text-box">
                  <strong>How to Play</strong>
                  {project.instructions}
                </div>
              )}

              {project.description && (
                <div className="text-box">
                  <strong>Notes & Credits</strong>
                  {project.description}
                </div>
              )}
            </article>
          ))}
        </div>
      </main>

      <Analytics />
    </>
  );
}
