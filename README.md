# hakoniwa2 — 昭和のパチンコ店

白い空間に浮かぶ、Three.js の動く箱庭です。昭和末期をイメージした架空の店舗「ニューハコニワ」を、外部画像・3Dモデルなしで作成しています。造形はジオメトリ、文字と台の液晶表示はコードで描く CanvasTexture です。

## 起動

```powershell
npm install
npm run dev -- --port 5173
```

ブラウザーで http://127.0.0.1:5173 を開きます。`npm run build` で `dist/` に配信用ファイルを生成できます。

## 操作

- ドラッグ：箱庭を回転。人の目線では見回す
- ホイール／ピンチ：箱庭を拡大・縮小
- 「人の目線へ」または V：客・店員の目線を順に切り替え
- 「箱庭」または Esc：全景へ戻る
- 「自動回転」：箱庭をゆっくり回転
- 「一時停止」または Space：店内の動きを停止・再開

18台のうち14台で客が遊戯しています。着席中の台では銀玉、数字、羽根、枠ランプが動き、一定周期で大当たり演出に切り替わります。空き台は静かな待機表示です。2人が通路を歩き、カウンターの店員、扇風機、時計も動きます。ゲーム・実際の賭博機能はありません。

## 検証

開発サーバー起動中に `npm test`。Windows の Microsoft Edge を Playwright からヘッドレス起動して、表示・回転・目線切替・一時停止・モバイル表示を確認し、`artifacts/` にスクリーンショットを保存します。別環境では環境変数 `BROWSER_EXECUTABLE` で Chromium 系ブラウザーの実行ファイルを指定できます。

使用 API: [Three.js OrbitControls](https://threejs.org/docs/pages/OrbitControls.html)

## ダブルクリックで開く（Windows）

Open-Hakoniwa.cmd をダブルクリックすると、ローカルサーバーをバックグラウンドで起動してブラウザーを開きます。起動済みなら同じサーバーを使います。PC再起動後もこのファイルから起動できます。


## iPhoneから家庭内ネットワークで開く

PCとiPhoneを同じルーターに接続し、PCで `Open-Hakoniwa-iPhone.cmd` をダブルクリックします。有線のPCでも利用できます。PCのブラウザーに表示された `http://192.168.…:5173/` などのURLをiPhoneのSafariで開きます。PCの起動中に利用でき、PCのIPアドレスが変わった場合は起動ファイルを再実行して新しいURLを確認してください。

この起動方法は家庭内ネットワークのIPv4アドレスだけで待ち受けます。Windowsのファイアウォール設定やルーター設定は変更しません。PC再起動後は起動ファイルをもう一度実行してください。

## GitHub Pages

公開URL: https://president-code-ai.github.io/hakoniwa2/

`main` ブランチへのpushでGitHub Actionsがビルドし、`dist/` だけをGitHub Pagesに配信します。公開サイトはGitHubから配信されるので、このPCの起動や家庭内Wi-Fiへの接続は不要です。

公開用のビルドでは `GITHUB_PAGES=true` によりパスを `/hakoniwa2/` に設定します。通常のローカル起動は従来どおり `/` を使います。ログ、テスト画像、依存パッケージ、環境変数ファイルはGit管理の対象外です。
