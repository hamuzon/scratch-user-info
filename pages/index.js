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
          align-items: center;
          min-height: 100vh;
          color: #fff;
          padding: 20px;
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
          margin: auto;
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
          min-width: 200px;
          padding: 10px;
          font-size: 16px;
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
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid #00ffcc;
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 20px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
          word-wrap: break-word;
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
          height: auto;
          border-radius: 10px;
          border: 3px solid #00ffcc;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
          margin-top: 10px;
          cursor: pointer;
          display: block;
          box-sizing: border-box;
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
          font-size: 14px;
        }

        .buttons {
          display: flex;
          gap: 10px;
          margin-top: 10px;
          flex-wrap: wrap;
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
          flex: 1;
          text-align: center;
          min-width: 80px;
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

        @media (max-width: 480px) {
          .form {
            flex-direction: column;
            align-items: stretch;
          }

          .button-group {
            display: flex;
            gap: 10px;
          }

          .button-group button {
            flex: 1;
          }

          .title {
            font-size: 20px;
          }
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

          <div className="button-group">
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
          </div>
        </form>

        {error && (
          <p style={{ color: '#ff4b5c', marginTop: 15, textAlign: 'center' }}>
            {error}
          </p>
        )}

        {userInfo && (
          <div style={{ marginTop: 25, borderBottom: '1px solid rgba(0,255,204,0.3)', paddingBottom: '15px' }}>
            <h2 style={{ fontSize: '18px', color: '#00ffcc', marginBottom: '10px' }}>
              ユーザー情報
            </h2>
            
            <p className="info">
              <strong>ユーザー名: </strong>
              {userInfo.username}
            </p>

            <p className="info">
              <strong>登録日: </strong>
              {userInfo.history?.joined ? new Date(userInfo.history.joined).toLocaleDateString('ja-JP') : '不明'}
            </p>
          </div>
        )}

        <div style={{ marginTop: 25 }}>
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
                  >
                    Scratch
                  </button>

                  <button
                    onClick={() =>
                      window.open(`https://turbowarp.org/${project.id}`, '_blank')
                    }
                    className="turbowarp-button"
                  >
                    TurboWarp
                  </button>
                </div>

                {project.instructions && (
                  <div className="usage">
                    <strong>使い方:</strong>
                    <p style={{ margin: '5px 0 0 0', whiteSpace: 'pre-wrap' }}>
                      {project.instructions}
                    </p>
                  </div>
                )}

                {project.description && (
                  <div className="description">
                    <strong>メモとクレジット:</strong>
                    <p style={{ margin: '5px 0 0 0', whiteSpace: 'pre-wrap' }}>
                      {project.description}
                    </p>
                  </div>
                )}
              </div>
            ))}
        </div>
      </main>
    </>
  );
}
