# CONNECT Corporate Website

株式会社CONNECTのコーポレートサイトリニューアルプロジェクトです。TOPページ、基本情報ページ、サービス一覧・詳細、News、Privacy、Contact画面を実装しています。

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

生成物は `dist/` に出力されます。

## Visual check

ローカルサーバーを起動した状態で、指定画面幅・全ページ・モバイルメニュー・Reduced Motion・フォーム入力チェックを確認できます。

```bash
npm run test:visual
```

## Current content sources

- 会社情報・事業情報: 現行サイト（https://ps-connect.jp/）
- 写真・ロゴ: 現行サイトの素材を仮利用
- 本番公開前に、人物・現場・オフィス・宮崎の新規撮影素材へ差し替える想定
