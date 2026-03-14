import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';

export default function Custom404() {
  return (
    <Layout title="404 - ページが見つかりません">


      <style jsx>{`
        .container {
          width: 100%;
          max-width: 600px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(10px);
          padding: 50px 20px;
          margin: 20px auto;
          box-sizing: border-box;
          text-align: center;
        }

        .title {
          font-size: 80px;
          font-weight: bold;
          margin: 0;
          color: #00ffcc;
          text-shadow: 0 0 15px rgba(0, 255, 204, 0.5);
          line-height: 1;
        }

        .subtitle {
          font-size: 22px;
          font-weight: bold;
          margin-top: 20px;
          margin-bottom: 25px;
          color: #fff;
        }

        .description {
          font-size: 15px;
          color: #e0e0e0;
          line-height: 1.7;
          margin-bottom: 35px;
        }

        .home-button {
          display: inline-block;
          padding: 12px 35px;
          font-size: 16px;
          font-weight: bold;
          color: #fff;
          background: linear-gradient(135deg, #00ffcc, #009999);
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
          text-decoration: none;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }

        .home-button:hover {
          background: linear-gradient(135deg, #00ffff, #00ccaa);
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(0, 255, 204, 0.3);
        }

        @media (max-width: 900px), (pointer: coarse), (hover: none) {
          .container {
            backdrop-filter: none;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
          }
          .home-button:hover {
            transform: none;
          }
        }

        @media (prefers-reduced-data: reduce) {
          .container {
            box-shadow: none;
            backdrop-filter: none;
          }
        }

        @media (max-width: 500px) {
          .container {
            padding: 40px 15px;
            margin: 10px auto;
            backdrop-filter: none;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
            background-color: rgba(255, 255, 255, 0.14);
          }

          .title {
            font-size: 64px;
          }

          .subtitle {
            font-size: 18px;
            margin-top: 15px;
          }
          
          .description {
            font-size: 14px;
          }
        }
      `}</style>

      <main className="container" role="main">
        <h1 className="title">404</h1>
        <h2 className="subtitle">お探しのページが見つかりません</h2>
        <p className="description">
          アクセスしようとしたページは削除されたか、<br />
          URLが間違っている可能性があります。
        </p>
        <Link href="/" className="home-button">
          ホームへ戻る
        </Link>
      </main>
    </Layout>
  );
}
