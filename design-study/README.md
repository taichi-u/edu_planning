# デザイン比較

本番の外観を変える前の比較用。保存・連携・認証の本番コードとは分離している。データはすべて`fixture.json`の仮データ。

```sh
node design-study/serve.mjs
```

- 比較一覧: http://127.0.0.1:4317/compare.html
- 個別画面: http://127.0.0.1:4317/
- 公開サンプルの再現: http://127.0.0.1:4317/studies/
- 状態: 通常、予定なし、取得失敗、同日の締切集中。
- 表示: 今週・3か月・博士全体。3案×日英で18画面。
- 言語選択はこのプレビューのブラウザに保持する。URL指定を優先する。

作業行を選ぶと作業記録を入力できる。保存先はタブ内の仮の記録で、再読み込み後も同じタブで確認できる。Site・GitHub・Trello・Calendarへ送信しない。新規作業のボタンは配置比較のみで無効。ナビゲーションの全機能を作った製品版ではない。

画面の構造は`scene.mjs`、配色・書体・用語は`themes.mjs`、表示状態のデータは`model.mjs`。同じ画面構造をHTMLとFigmaの要素生成に使う。Figmaには呼び出し上限による未作成画面がある（[進捗](figma/README.md)）。選定後にFigmaの採用仕様と実装を揃える。

## 面談用の図

- [Canva：日付補正版](https://www.canva.com/d/u3LldXiY09wL3bK)
- [日英2ページのPDF](../output/pdf/research-plan-comparison.pdf)
- 元の配置計算: `meeting-figure.py`

自動生成した最初のCanva案には誤字と時間軸のずれがあり、採用していない。修正版はPDFの図形と文字を取り込んだもの。2ページのプレビューと文字の抽出結果を確認した。Canvaのグループ分割・文字幅は元PDFと一致するとは保証しない。UI仕様はCanvaで管理しない。

PDF生成にはPythonの`reportlab`、`fonttools`と、既存の`@fontsource/ibm-plex-sans-jp`を使う。WOFFからTrueType形式を展開して埋め込む。書体の許諾表示は`output/pdf/FONT-LICENSE.txt`。

## 再現練習と利用条件

`studies/manifest.json`に対象サンプル、取得日、Git blob ID、差分を保存。`studies/sources/`にはMITの許諾表示と取得したソースを保存している。3例とも部分的なHTML再構成であり、公式のReact実装や製品画面全体を複製したものではない。寸法表はソースの指定値とこのブラウザの計算値の比較。公式画面のスクリーンショットとの差分率ではない。

ソースはGit blob IDの確認のため元のバイト列を保持する。`smart-preset.ts.txt`の元コードにある1行の末尾空白は変更せず、このファイルだけ`.gitattributes`で空白検査の対象外にしている。独自コードの空白検査は継続する。

## 検証

```sh
node --test design-study/study.test.mjs
```

期間と日付の計算、空の状態、同じ仮データによる比較、未入力と0、本文のコントラストを確認する。ブラウザでの検証結果と残る事項は[検証記録](../docs/design/verification-2026-10.md)に記録する。
