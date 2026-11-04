# Dashboard 01 の黒基調の見本

shadcn/ui 公式の Dashboard 01 をダーク表示で再現した独立したアプリ。比較対象はこの1画面。デモの英語・数値・操作を保持している。[公式の実画面](https://ui.shadcn.com/view/new-york-v4/dashboard-01) ／ [複製の画面](preview-dark.png)

## 起動

このディレクトリで Node.js 22.13 以降を使う。

```sh
npm ci
npm run dev
```

表示先は [ローカルの見本](http://127.0.0.1:4318/)。配布用の検証は `npm run build` の後に `npm run preview`。ダッシュボード自身の表・グラフの切り替えを確認できる。研究ロードマップのDBや外部サービスには接続しない。

## 取得元

- **ブロックと部品**　2026-11-04に、公式レジストリの11ファイルと、依存するUI・フック23項目を取得した。配布されたコンポーネント本文・ディレクトリ構造・仮データは `src/registry` に保存。ライセンスはMIT。[公式の配布データ](https://ui.shadcn.com/r/styles/new-york-v4/dashboard-01.json) ／ [上流の実装](https://github.com/shadcn-ui/ui/tree/main/apps/v4/registry/new-york-v4/blocks/dashboard-01) ／ [ライセンス表示](LICENSE-shadcn.md)
- **表示環境**　公式サイトのテーマ変数を `src/styles.css` に取り込み、ダーク表示に固定。GeistはFontsource版をローカル配信する。エントリーポイント、Vite設定、クラス名結合ヘルパーは比較アプリ用。アバターは公式リポジトリの同じファイルを使用。[上流のテーマ](https://github.com/shadcn-ui/ui/blob/main/apps/v4/app/globals.css) ／ [アバターの配布元](https://github.com/shadcn-ui/ui/blob/main/apps/v4/public/avatars/shadcn.jpg)

## 照合

Chromeでダーク表示・1440 × 1000 px・DPR 1に揃えた。公式と複製はいずれも、左ナビ幅288 px、上段カードの左上 (312, 80)、最初のカード262 × 204 px、グラフ枠1096 × 392 px、表の上端785 px。1画像ごとの比較でRGBいずれかの差が12を超えた画素は全体の約0.28%。フォントの供給元やグラフの文字描画などの差はある。

表の詳細パネルとページ送り、グラフの期間切り替え、PC・390 px幅のサイドバー開閉を確認した。
