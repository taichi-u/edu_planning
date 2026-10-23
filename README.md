# edu_planning

B4、5年一貫博士課程、その後の研究・論文・学会・申請の期間と締切を管理するChatGPT Site。

## 開発

Node.js 22.13以降。`npm install`、`npm run db:generate`（スキーマ変更時のみ）、`npm run build`。

ローカルDBの初期化（初回のみ、ビルド後）:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_skinny_maddog.sql
npm run dev
```

ローカルでは `/signin-with-chatgpt?return_to=/` で開発用ユーザーとしてサインインできる。公開環境はSitesの本人認証を使う。ローカルデータは `.wrangler/` に保存され、Gitには含めない。

`npm run typecheck`、`npm test`、`npm run build` で検証。設計は [docs/design/decisions.md](docs/design/decisions.md)。コミット運用は [AGENTS.md](AGENTS.md)。

## 初回利用

Siteを本人専用のまま開き「仮データで開始」または「空の計画で開始」を選ぶ。最初の所有者を固定し、他の閲覧者は編集不可。所有者が初期化する前にSiteの閲覧範囲を拡大しない。

実際の計画を保存する場合は案件の「仮データ」を外す。正式締切を「確認済み」にするには日付・出典URL・確認日が必要。時刻なしは終日、時刻ありは指定したIANAタイムゾーンで扱う。

## 共有とPDF

案件を共有対象にし、共有用名称と閲覧者メールを設定する。節目にも共有可否がある。Sites側の閲覧権限とアプリ内の案件権限の両方が必要。外部招待の利用可否はSites設定に依存するため、初回公開は本人専用。未指定の宛先への招待は送らない。

「面談用表示」と「PDF」は研究レーン・研究テーマ・メモ・資料URLをサーバーで除外する。PDFは横長の印刷画面で期間とカテゴリーを選び、ブラウザの「PDFに保存」を使う。公開リポジトリにはコードと架空のサンプルだけを保存する。

## 会話からの操作

Sitesの公開時に作成されるAppをChatGPT/Codexへ接続する。`/mcp` に一覧・詳細・スキーマ・案件追加/変更/アーカイブ・履歴ツールがある。画面は30秒ごと、またはフォーカス復帰時に最新データを取得する。編集中は自動取得を停止し、保存時にrevisionで競合を検出する。競合した編集は再取得して確認する。

## Google Calendar

会話からの一方向同期。直接OAuthやバックグラウンド同期は実装しない。

1. 人間が同期を依頼したら、接続済みGoogle Calendarのカレンダー一覧を確認する。
2. `calendar_targets` で選択された項目を取得。仮データ・月のみ・未定は対象外。
3. 各項目で `calendar_prepare` を呼び、5分の排他リース・安定マーカー・既存イベントID・payloadを受け取る。
4. イベントIDがあれば取得して更新。なければ対象カレンダーでdescriptionに含まれるマーカーを検索し、完全一致を確認。見つかれば既存イベントを使う。検索失敗、通信結果不明、不完全な検索結果のまま新規作成しない。リース期限を超えた操作は停止して再確認。
5. 終日予定は排他的end_date。時刻付きはstart_local / end_localをtimezoneで解釈する。終了日なしの節目は30分、終了日がある予定はその日の同じ時刻まで。参加者を追加せず、通知は `use_default: true`。
6. 成功時は `calendar_record` にreceiptとeventIdを渡す。同一内容の再同期は `unchanged`。作成成功後に記録が失敗してもマーカーで回復する。

同期対象解除・案件アーカイブで既存カレンダー予定を自動削除しない。削除は人間の明示指示に従う。実カレンダーへサンプルを書き込むテストは行わない。
