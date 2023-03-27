// アプリケーション作成用のモジュールを読み込み
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");

// メインウィンドウ
let mWin;

const createWindow = () => {
  // メインウィンドウを作成します
  mWin = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // プリロードスクリプトは、レンダラープロセスが読み込まれる前に実行され、
      // レンダラーのグローバル（window や document など）と Node.js 環境の両方にアクセスできます。
      preload: path.join(__dirname, "preload.js"),
    },
  });
  mWin.setMenuBarVisibility(false);
  // メインウィンドウに表示するURLを指定します
  // （今回はmain.jsと同じディレクトリのindex.html）
  mWin.loadFile("index.html");

  // // デベロッパーツールの起動
  // mainWindow.webContents.openDevTools();

  // メインウィンドウが閉じられたときの処理
  mWin.on("closed", () => {
    mWin = null;
  });
};

//  初期化が完了した時の処理
app.whenReady().then(() => {
  ipcMain.handle("dialog:openFile", handleFileOpen); // プロセス間通信
  ipcMain.handle("accessDb", accessDb); // プロセス間通信

  createWindow();
  // アプリケーションがアクティブになった時の処理(Macだと、Dockがクリックされた時）
  app.on("activate", () => {
    // メインウィンドウが消えている場合は再度メインウィンドウを作成する
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 全てのウィンドウが閉じたときの処理
app.on("window-all-closed", () => {
  // macOSのとき以外はアプリケーションを終了させます
  if (process.platform !== "darwin") {
    app.quit();
  }
});

async function handleFileOpen(e, a) {
  console.log(a);
  const { canceled, filePaths } = await dialog.showOpenDialog();
  if (canceled) {
    return;
  } else {
    return filePaths[0];
  }
}
const conf = require("config");
const { sqliteDb } = require("../sql.js");
const db = new sqliteDb();
const { D } = require("../lib/defain.js");
async function accessDb(e, tName, method, year, cond, rec) {
  console.log(tName, method, cond, rec);
  if (year) db.setYear(year);
  switch (method) {
    case "select":
      return await db.select(tName, cond);
    case "edit":
    case "delete":
  }
}
// async function ttt() {
//   console.log(seasons);
// }
// ttt();
