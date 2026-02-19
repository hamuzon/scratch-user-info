# scratch-user-info  

スクラッチのuserの作品の詳細を出します  
使われずerrorになるときもあるかも

URL-1  
<https://scratch-user-info.vercel.app/>

![Vercel Deploy](https://deploy-badge.vercel.app/vercel/scratch-user-info)

URL-2  
<https://scratch-project-innfo.netlify.app/>

[![Netlify Status](https://api.netlify.com/api/v1/badges/7633fa26-7180-46b1-887f-e247e6debd54/deploy-status)](https://app.netlify.com/projects/scratch-project-innfo/deploys)

URL-3  
<https://scratch.hamusata.f5.si/>

## Deployメモ（Next.js / Cloudflare Workers）

- ルート配下以外で公開する場合（例: `https://example.com/scratch-user-info/`）は、`NEXT_PUBLIC_BASE_PATH` を設定してください。
- `next.config.mjs` で `basePath` / `assetPrefix` に同じ値が反映されます。
- フロント側の API 呼び出しは `router.basePath` を使っているので、Cloudflare Workers 上のサブパス配信でも `/api/user` が正しい URL になります。
