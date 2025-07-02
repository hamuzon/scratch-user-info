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
      // デプロイしたWorkerのURLを入れてください
      const res = await fetch('https://scratch-user-info.hamusata.workers.dev', {
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
    } catch (e) {
      console.error(e);
      setError('通信エラーが発生しました。');
    }
  };

  const reset = () => {
    setUsername('');
    setUserInfo(null);
    setProjects([]);
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

      <main className="container" role="main">
        <h1 className="title">Scratchユーザー情報表示</h1>

        <form
          onSubmit={e => {
            e.preventDefault();
            fetchUserInfo();
          }}
        >
          <input
            type="text"
            placeholder="ユーザー名を入力"
            value={username}
            onChange={e => setUsername(e.target.value)}
            aria-label="ユーザー名入力"
            required
          />
          <button type="submit" aria-label="情報取得">情報取得</button>
          <button type="button" onClick={reset} aria-label="リセット">リセット</button>
        </form>

        {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}

        {userInfo && (
          <div style={{ marginTop: 20 }}>
            <h2>ユーザー情報</h2>
            <p><strong>ユーザー名: </strong>{userInfo.username}</p>
            <p>
              <strong>登録日: </strong>
              {userInfo.history?.joined
                ? new Date(userInfo.history.joined).toLocaleDateString('ja-JP')
                : '不明'}
            </p>
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          {projects.length > 0 && projects.map(project => (
            <div key={project.id} className="project">
              <p className="project-title">
                <a href={`https://scratch.mit.edu/projects/${project.id}`} target="_blank" rel="noopener noreferrer">
                  {project.title}
                </a>
              </p>
              <a href={`https://scratch.mit.edu/projects/${project.id}`} target="_blank" rel="noopener noreferrer" tabIndex={-1}>
                <img
                  src={`https://cdn2.scratch.mit.edu/get_image/project/${project.id}_480x360.png`}
                  alt={`${project.title} サムネイル`}
                  className="project-image"
                />
              </a>
              <p className="info">
                <strong>ID:</strong>{' '}
                <a href={`https://scratch.mit.edu/projects/${project.id}`} target="_blank" rel="noopener noreferrer">
                  {project.id}
                </a>
              </p>
              <p className="info">
                <strong>共有日:</strong> {project.published_date}
                <br />
                <strong>最終更新日:</strong> {project.modified_date}
              </p>
              <div className="buttons">
                <button onClick={() => window.open(`https://scratch.mit.edu/projects/${project.id}`, '_blank')} aria-label={`Scratchで${project.title}を開く`}>
                  S
                </button>
                <button onClick={() => window.open(`https://turbowarp.org/${project.id}`, '_blank')} aria-label={`TurboWarpで${project.title}を開く`}>
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
