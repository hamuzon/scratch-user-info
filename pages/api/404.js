import Head from 'next/head';
import Link from 'next/link';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - ページが見つかりません | Scratchユーザー情報</title>
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
        }
      `}</style>

      <style jsx>{`
        .container {
          text-align: center;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 40px;
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          max-width: 90%;
          width: 400px;
          box-sizing: border-box;
        }
        h1 {
          color: #00ffcc;
          margin-bottom: 20px;
          font-size: 3rem;
          margin-top: 0;
        }
        p {
          margin-bottom: 30px;
          line-height: 1.6;
          color: #e0e0e0;
        }
        .home-link {
          display: inline-block;
          padding: 12px 24px;
          background: linear-gradient(135deg, #00ffcc, #009999);
          color: white;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          transition: transform 0.2s, box-shadow 0.2s;
          border: none;
        }
        .home-link:hover {
          transform: scale(1.05);
          box-shadow: 0 0 10px rgba(0, 255, 204, 0.4);
        }
      `}</style>

      <div className="container">
        <h1>404</h1>
        <p>お探しのページは見つかりませんでした。<br />削除されたか、URLが間違っている可能性があります。</p>
        <Link href="/" className="home-link">
          ホームに戻る
        </Link>
      </div>
    </>
  );
}