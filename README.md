# oyasai-todo
Todo List with Timer

## Demo
[TODO: URLの追加]

## ファイル構成について
### エディター・タスクランナー・コンパイラーの設定ファイル
- `/.vscode/*` : VSCodeの設定ファイル
- `/tsconfig.json` : TypeScriptのコンパイラーのための設定ファイル
- `/gulpfile.js` : gulpというタスクランナーの設定ファイル。 sass, pugのコンパイルやミニファイをする作業を書いてある(TypeScriptのコンパイルについては書いていない)
- `/package.json` : コンパイルに必要なパッケージのリストなどが書かれている(pugファイルから参照されることがある)

### `src`から自動生成されるファイル
- `/out/css/*.css` : `/src/sass` からコンパイルされたファイル
- `/out/css/*.min.css` : `/css/*.css` からミニファイされたファイル
- `/out/js/*.js` : `/src/ts` からコンパイルされたファイル
- `/out/js/bundle.js` : `/js/*.js` からロールアップされたファイル
- `/out/js/bundle.min.js` : `/js/bundle.js` からミニファイされたファイル
- `/out/*.html` : `/src/pug/*.pug` からコンパイルされたファイル
- `/typedocs/**/*` : `/src/ts` から生成されたドキュメンテーションファイル。(TypeScriptのファイル中に書いたドキュメンテーションがまとめられている)

### 人が書いたソースコード
- `/src/pug/*.pug` : pugファイル。htmlにコンパイルされる
- `/src/pug/config.json` : pugファイルから参照されるJSONファイル
- `/src/sass/*.sass` : sassファイル。cssにコンパイルされる
- `/src/ts/*.ts` : TypeScriptファイル。jsにコンパイルされる

### その他
- `/License` : ライセンス
- `/README.md` : このファイル
- `/.gitignore` : Gitでの管理から除外するファイルのリスト

## ソースコードを書き換えたりして遊んでみたい
次の手順を踏んでください。

### 初回のみ: 必要なファイルのダウンロード
1. [Node.js](https://nodejs.org) のインストール (Linux, OS Xでは[nvm](https://github.com/creationix/nvm)  Windowsでは [nvm-windows](https://github.com/coreybutler/nvm-windows) を使うと後に面倒が起きなかったりする)
2. このレポジトリをダウンロード
3. ターミナル(Windowsでは、コマンドプロンプト)を開く
4. ダウンロードしたフォルダーをカレントディレクトリにする
5. (任意) `npm install -g pnpm` を実行し、[pnpm](https://github.com/pnpm/pnpm)を入れる
6. pnpmを入れたのであれば、`pnpm install`、そうでなければ`npm install` を実行
7. `npm install typescript` を実行
以上で、プログラムのコンパイルなどに必要なファイルが全て揃いました。

### 繰り返し: ビルド
1. ターミナル(Windowsでは、コマンドプロンプト)を開く
2. ダウンロードしたフォルダーをカレントディレクトリにする
3. `npm run dev` を実行 (sass, pugのコンパイル・css, jsのミニファイが行われる。`src`フォルダー内のファイルを書き換えるたびに自動読込されるブラウザーも立ち上げられる)
4. それと同時に、`npm run tsc` を実行 (typescriptのコンパイルが行われる) (gulpでtypescriptもコンパイルさせるとき、そのエラーレポートをVS Code に解釈させる方法を知らなかったため、 gulp に typescript のコンパイルを含めなかった)
5. 一段落したら、`npm run typedoc` を実行し、`typedocs` フォルダーの中身を自動生成

(dev, tsc, typedoc のコマンドは、VS Codeでは、`Tasks: Run Task`することで Configured Tasks としても表示されます。)