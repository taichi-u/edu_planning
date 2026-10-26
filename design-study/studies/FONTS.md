# 書体の確認

確認日: 2026-10-26。比較案は通常400・500、見本と一部見出しは600までを使用する。

| 書体 | 配布元・利用条件 | 使用 |
| --- | --- | --- |
| Noto Sans JP | [Google Fonts / OFL 1.1](https://github.com/google/fonts/blob/main/ofl/notosansjp/OFL.txt) | 案1・2の日本語本文 |
| Noto Serif JP | [Google Fonts / OFL 1.1](https://github.com/google/fonts/blob/main/ofl/notoserifjp/OFL.txt) | 案2の日本語見出し |
| Source Sans 3 | [Adobe / OFL 1.1](https://github.com/adobe-fonts/source-sans/blob/release/LICENSE.md) | 案1・2の英語本文 |
| Source Serif 4 | [Adobe / OFL 1.1](https://github.com/adobe-fonts/source-serif/blob/release/LICENSE.md) | 案2の英語見出し |
| IBM Plex Sans JP / IBM Plex Sans | [IBM / OFL 1.1](https://github.com/IBM/plex/blob/master/LICENSE.txt) | 案3、面談用PDF |

ブラウザの書体はGoogle Fontsから読み込む。Webフォントファイルをこの比較用ディレクトリに再配布していない。提供元による更新・接続失敗でフォールバックが起きる可能性がある。採用後の本番ではバージョンを固定して同梱する。

面談用PDFは既存依存`@fontsource/ibm-plex-sans-jp@5.3.1`の400・500を埋め込む。フォント名を変更せず、許諾表示をPDFと同じディレクトリに保持する。Figmaは利用可能な同名書体を使う。配布元のファイルと同じ版であることまでは確認できていない。

書体、コード、デザインデータ、ブランド素材は別に確認する。OSSライブラリのMITを、サービスのロゴや製品画面全体の許諾とは扱わない。
