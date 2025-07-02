// pages/index.js
import { useState } from 'react';
import Head from 'next/head';

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
        <link rel="icon" href="/icon-light.png" />
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
          padding: 20px;
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
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 20px;
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
          padding: 10px;
          font-size: 14px;
          color: #fff;
          border: 1px solid #00ffcc;
          border-radius: 8px;
          background-color: transparent;
          outline: none;
          transition: all 0.3s;
        }
        input:focus {
          border-color: #00ffff;
          box-shadow: 0 0 8px #00ffff;
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
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid #00ffcc;
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 20px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        }
        .project-title a {
          font-size: 18px;
          font-weight: bold;
          color: #00ffcc;
          text-decoration: none;
        }
        .project-title a:hover {
          text-decoration: underline;
        }
        .project-image {
          width: 100%;
          border-radius: 10px;
          border: 3px solid #00ffcc;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
          margin-top: 10px;
          cursor: pointer;
          display: block;
        }
        .info {
          font-size: 14px;
          color: #e0e0e0;
          margin-top: 10px;
        }
        .info a {
          color: #00ffcc;
          text-decoration: underline;
        }
        .usage, .description {
          margin-top: 15px;
          padding: 10px;
          border-radius: 5px;
          border: 1px solid #00ffcc;
          background-color: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        .buttons {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }
        .scratch-button, .turbowarp-button {
          padding: 8px 16px;
          font-size: 14px;
          font-weight: bold;
          color: #fff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
        }
        .scratch-button {
          background: linear-gradient(135deg, #00ffcc, #009999);
        }
        .scratch-button:hover {
          background: linear-gradient(135deg, #00ffff, #00ccaa);
        }
        .turbowarp-button {
          background: linear-gradient(135deg, #ff9800, #ff5722);
        }
        .turbowarp-button:hover {
          background: linear-gradient(135deg, #ffc107, #ff7043);
        }
      `}</style>

      <main className="container" role="main">
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
            aria-label="ユーザー名入力"
            required
          />
          <button type="submit" className="submit-button" aria-label="情報取得">
            情報取得
          </button>
          <button
            type="button"
            onClick={reset}
            className="reset-button"
            aria-label="リセット"
          >
            リセット
          </button>
        </form>

        {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}

        {userInfo && (
          <div style={{ marginTop: 20 }}>
            <h2>ユーザー情報</h2>
            <p>
              <strong>ユーザー名: </strong>
              {userInfo.username}
            </p>
            <p>
              <strong>登録日: </strong>
              {userInfo.history?.joined ? new Date(userInfo.history.joined).toLocaleDateString('ja-JP') : '不明'}
            </p>
            {/* 必要に応じて他のユーザー情報も表示可能 */}
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          {projects.length > 0 &&
            projects.map((project) => (
              <div key={project.id} className="project">
                <p className="project-title">
                  <a
                    href={`https://scratch.mit.edu/projects/${project.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {project.title}
                  </a>
                </p>
                <a
                  href={`https://scratch.mit.edu/projects/${project.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={-1}
                >
                  <img
                    src={`https://cdn2.scratch.mit.edu/get_image/project/${project.id}_480x360.png`}
                    alt={`${project.title} サムネイル`}
                    className="project-image"
                  />
                </a>
                <p className="info">
                  <strong>ID:</strong>{' '}
                  <a
                    href={`https://scratch.mit.edu/projects/${project.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {project.id}
                  </a>
                </p>
                <p className="info">
                  <strong>共有日:</strong> {project.published_date}
                  <br />
                  <strong>最終更新日:</strong> {project.modified_date}
                </p>
                <div className="buttons">
                  <button
                    onClick={() =>
                      window.open(`https://scratch.mit.edu/projects/${project.id}`, '_blank')
                    }
                    className="scratch-button"
                    aria-label={`Scratchで${project.title}を開く`}
                  >
                    S
                  </button>
                  <button
                    onClick={() =>
                      window.open(`https://turbowarp.org/${project.id}`, '_blank')
                    }
                    className="turbowarp-button"
                    aria-label={`TurboWarpで${project.title}を開く`}
                  >
                    T
                  </button>
                </div>
                {project.instructions && (
                  <div className="usage" aria-label="使い方説明">
                    <strong>使い方:</strong>
                    <p>{project.instructions}</p>
                  </div>
                )}
                {project.description && (
                  <div className="description" aria-label="メモとクレジット">
                    <strong>メモとクレジット:</strong>
                    <p>{project.description}</p>
                  </div>
                )}
              </div>
            ))}
        </div>
      </main>
    </>
  );
}
