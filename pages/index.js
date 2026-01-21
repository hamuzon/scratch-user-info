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
        <link rel="icon" href="/icon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <style jsx global>{`
        body {
          font-family: 'Roboto', sans-serif;
          background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
          margin: 0;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          min-height: 100vh;
          color: #fff;
          padding: 20px;
          box-sizing: border-box;
        }
      `}</style>

      <style jsx>{`
        .container {
          width: 100%;
          max-width: 700px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(15px);
          padding: 30px 20px;
          margin: 20px auto;
        }

        .title {
          font-size: clamp(1.5rem, 5vw, 2rem);
          font-weight: bold;
          text-align: center;
          margin-bottom: 30px;
          color: #00ffcc;
          text-shadow: 0 0 10px rgba(0, 255, 204, 0.3);
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 15px;
          width: 100%;
        }

        @media (min-width: 480px) {
          .form {
            flex-direction: row;
          }
        }

        input {
          flex: 2;
          padding: 12px 15px;
          font-size: 16px;
          color: #fff;
          border: 2px solid #00ffcc;
          border-radius: 10px;
          background-color: rgba(0, 0, 0, 0.2);
          outline: none;
          transition: all 0.3s ease;
        }

        input:focus {
          border-color: #00ffff;
          box-shadow: 0 0 12px rgba(0, 255, 255, 0.5);
        }

        .button-group {
          display: flex;
          gap: 10px;
          flex: 1;
        }

        button {
          padding: 12px;
          font-size: 14px;
          font-weight: bold;
          color: #fff;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
          white-space: nowrap;
        }

        button:active {
          transform: scale(0.95);
        }

        .submit-button {
          flex: 2;
          background: linear-gradient(135deg, #00ffcc, #009999);
        }

        .reset-button {
          flex: 1;
          background: linear-gradient(135deg, #ff4b5c, #d42e40);
        }

        .user-card {
          margin-top: 30px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 15px;
          border-left: 5px solid #00ffcc;
        }

        .project-list {
          margin-top: 30px;
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .project {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(0, 255, 204, 0.3);
          border-radius: 15px;
          padding: 20px;
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
          transition: translateY 0.3s;
        }

        .project-title a {
          font-size: 1.2rem;
          font-weight: bold;
          color: #00ffcc;
          text-decoration: none;
          display: block;
          margin-bottom: 12px;
        }

        .project-image {
          width: 100%;
          height: auto;
          aspect-ratio: 4 / 3;
          object-fit: cover;
          border-radius: 10px;
          border: 2px solid rgba(0, 255, 204, 0.5);
          margin: 10px 0;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 10px;
          margin: 15px 0;
          font-size: 13px;
          color: #ccc;
        }

        .usage, .description {
          margin-top: 15px;
          padding: 12px;
          border-radius: 8px;
          background-color: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(0, 255, 204, 0.2);
          font-size: 14px;
          line-height: 1.6;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 15px;
        }

        .scratch-button, .turbowarp-button {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 40px;
        }

        .scratch-button { background: #4d97ff; }
        .turbowarp-button { background: #ff4c4c; }

        .error-message {
          color: #ff6b6b;
          background: rgba(255, 107, 107, 0.1);
          padding: 10px;
          border-radius: 8px;
          margin-top: 15px;
          text-align: center;
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
            placeholder="ユーザー名を入力"
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

        {error && <div className="error-message">{error}</div>}

        {userInfo && (
          <section className="user-card">
            <h2>ユーザー情報</h2>
            <p><strong>ユーザー名:</strong> {userInfo.username}</p>
            <p>
              <strong>登録日:</strong>{' '}
              {userInfo.history?.joined 
                ? new Date(userInfo.history.joined).toLocaleDateString('ja-JP') 
                : '不明'}
            </p>
          </section>
        )}

        <div className="project-list">
          {projects.map((project) => (
            <article key={project.id} className="project">
              <div className="project-title">
                <a href={`https://scratch.mit.edu/projects/${project.id}`} target="_blank" rel="noopener noreferrer">
                  {project.title}
                </a>
              </div>

              <a href={`https://scratch.mit.edu/projects/${project.id}`} target="_blank" rel="noopener noreferrer">
                <img
                  src={`https://cdn2.scratch.mit.edu/get_image/project/${project.id}_480x360.png`}
                  alt={project.title}
                  className="project-image"
                  loading="lazy"
                />
              </a>

              <div className="info-grid">
                <div><strong>ID:</strong> {project.id}</div>
                <div><strong>共有:</strong> {project.published_date}</div>
                <div><strong>更新:</strong> {project.modified_date}</div>
              </div>

              <div className="action-buttons">
                <button
                  onClick={() => window.open(`https://scratch.mit.edu/projects/${project.id}`, '_blank')}
                  className="scratch-button"
                >
                  S
                </button>
                <button
                  onClick={() => window.open(`https://turbowarp.org/${project.id}`, '_blank')}
                  className="turbowarp-button"
                >
                  T
                </button>
              </div>

              {project.instructions && (
                <div className="usage">
                  <strong>使い方:</strong>
                  <p>{project.instructions}</p>
                </div>
              )}

              {project.description && (
                <div className="description">
                  <strong>メモとクレジット:</strong>
                  <p>{project.description}</p>
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
