// pages/index.js
import { useState } from 'react';
import Head from 'next/head';
import { Analytics } from '@vercelanalytics/next';

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
        {/* レスポンシブ用のメタタグを追加 */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <style jsx global>{`
        body {
          font-family: 'Roboto', sans-serif;
          background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
          margin: 0;
          display: flex;
          justify-content: center;
          align-items: flex-start; /* 中央固定から上部開始に変更（長文対策） */
          min-height: 100vh;
          color: #fff;
          padding: 20px 10px; /* 左右の余白を調整 */
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
          box-sizing: border-box;
        }
        .title {
          font-size: clamp(20px, 5vw, 24px); /* 画面サイズに合わせて可変 */
          font-weight: bold;
          text-align: center;
          margin-bottom: 20px;
          color: #00ffcc;
        }
        .form {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap; /* 折り返しを許可 */
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        input {
          flex: 1;
          min-width: 200px; /* スマホでボタンが横に来ないよう最小幅を設定 */
          padding: 12px;
          font-size: 16px; /* モバイルでズームされないよう16px推奨 */
          color: #fff;
          border: 1px solid #00ffcc;
          border-radius: 8px;
          background-color: rgba(0,0,0,0.2);
          outline: none;
          transition: all 0.3s;
          box-sizing: border-box;
        }
        input:focus {
          border-color: #00ffff;
          box-shadow: 0 0 8px #00ffff;
        }
        .button-group {
          display: flex;
          gap: 10px;
          width: 100%;
          justify-content: center;
        }
        button {
          padding: 12px 20px;
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
          flex: 2; /* 取得ボタンを少し大きく */
        }
        .submit-button:hover {
          background: linear-gradient(135deg, #00ffff, #00ccaa);
        }
        .reset-button {
          background: linear-gradient(135deg, #ff4b5c, #d42e40);
          flex: 1;
        }
        .reset-button:hover {
          background: linear-gradient(135deg, #ff6f7c, #ff4b5c);
        }
        .project {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid #00ffcc;
          border-radius: 10px;
          padding: 15px;
          margin-top: 20px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
          word-break: break-word; /* テキストのあふれ防止 */
        }
        .project-title a {
          font-size: 18px;
          font-weight: bold;
          color: #00ffcc;
          text-decoration: none;
        }
        .project-image {
          width: 100%;
          height: auto; /* 高さを自動調整 */
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
          line-height: 1.4;
        }
        .usage, .description {
          margin-top: 15px;
          padding: 12px;
          border-radius: 5px;
          border: 1px solid rgba(0, 255, 204, 0.5);
          background-color: rgba(255, 255, 255, 0.05);
          color: #fff;
          font-size: 13px;
        }
        .buttons {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }
        .scratch-button, .turbowarp-button {
          flex: 1; /* ボタンを均等に広げる */
          padding: 10px;
          text-align: center;
        }
        
        /* タブレット・PC向けの微調整 */
        @media (min-width: 480px) {
          .button-group {
            width: auto;
          }
          .submit-button, .reset-button {
            flex: none;
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

        {error && <p style={{ color: '#ff4b5c', marginTop: 15, textAlign: 'center' }}>{error}</p>}

        {userInfo && (
          <div style={{ marginTop: 25, padding: '10px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>ユーザー情報</h2>
            <p className="info"><strong>ユーザー名:</strong> {userInfo.username}</p>
            <p className="info">
              <strong>登録日:</strong> {userInfo.history?.joined ? new Date(userInfo.history.joined).toLocaleDateString('ja-JP') : '不明'}
            </p>
          </div>
        )}

        <div style={{ marginTop: 10 }}>
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
                  <strong>ID:</strong> {project.id}
                </p>
                <p className="info">
                  <strong>共有日:</strong> {project.published_date}<br/>
                  <strong>最終更新:</strong> {project.modified_date}
                </p>
                <div className="buttons">
                  <button
                    onClick={() =>
                      window.open(`https://scratch.mit.edu/projects/${project.id}`, '_blank')
                    }
                    className="scratch-button"
                    aria-label={`Scratchで${project.title}を開く`}
                  >
                    Scratchで見る
                  </button>
                  <button
                    onClick={() =>
                      window.open(`https://turbowarp.org/${project.id}`, '_blank')
                    }
                    className="turbowarp-button"
                    aria-label={`TurboWarpで${project.title}を開く`}
                  >
                    TurboWarp
                  </button>
                </div>
                {project.instructions && (
                  <div className="usage">
                    <strong>使い方:</strong>
                    <p style={{whiteSpace: 'pre-wrap'}}>{project.instructions}</p>
                  </div>
                )}
                {project.description && (
                  <div className="description">
                    <strong>メモとクレジット:</strong>
                    <p style={{whiteSpace: 'pre-wrap'}}>{project.description}</p>
                  </div>
                )}
              </div>
            ))}
        </div>
      </main>
      <Analytics />
    </>
  );
}
