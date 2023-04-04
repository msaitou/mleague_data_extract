// アプリケーション作成用のモジュールを読み込み
const { app, BrowserWindow, ipcMain, dialog, autoUpdater } = require("electron");
// run this as early in the main process as possible
if (require("electron-squirrel-startup")) app.quit();

if (handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}

function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require("child_process");
  const path = require("path");

  const appFolder = path.resolve(process.execPath, "..");
  const rootAtomFolder = path.resolve(appFolder, "..");
  const updateDotExe = path.resolve(path.join(rootAtomFolder, "Update.exe"));
  const exeName = path.basename(process.execPath);

  const spawn = function (command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, { detached: true });
    } catch (error) {}

    return spawnedProcess;
  };

  const spawnUpdate = function (args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case "--squirrel-install":
    case "--squirrel-updated":
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(["--createShortcut", exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case "--squirrel-uninstall":
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(["--removeShortcut", exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case "--squirrel-obsolete":
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      app.quit();
      return true;
  }
}
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
    icon: "src/image/m.ico",
    // title: `Mリーグ-データ抽出解析くん（haruzo専用） ${app.getVersion()}`,
  });
  mWin.setMenuBarVisibility(false);
  // メインウィンドウに表示するURLを指定します
  // （今回はmain.jsと同じディレクトリのindex.html）
  mWin.loadFile("src/index.html");

  // // デベロッパーツールの起動
  // mainWindow.webContents.openDevTools();

  // メインウィンドウが閉じられたときの処理
  mWin.on("closed", () => {
    mWin = null;
  });
};

//  初期化が完了した時の処理
app.whenReady().then(() => {
  ipcMain.handle("accessDb", accessDb); // プロセス間通信
  ipcMain.handle("extractedData", extractedData); // プロセス間通信
  ipcMain.handle("convert", convert); // プロセス間通信
  ipcMain.handle("extract", extract); // プロセス間通信
  createWindow();
  // logger.info(app.getVersion());
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

const logger = require("../initter.js").log();
global.log = logger;
const conf = require("electron-node-config");
const { sqliteDb } = require("../sql.js");
const { Convert } = require("../convert.js");
const { WebCls } = require("../index.js");
const db = new sqliteDb();
const { D } = require("../lib/defain.js");
async function accessDb(e, tName, method, year, params = {}) {
  logger.info(tName, method, params);
  if (year) db.setYear(year);
  try {
    switch (method) {
      case "select":
        return await db.select(tName, params.cond, params.fields);
      case "insert":
        return await db.insert(tName, params.recs);
      case "update":
        return await db.update(tName, params.recs, params.cond);
      case "delete":
        return await db.delete(tName, params.cond);
    }
  } catch (e) {
    logger.warn(e);
    return { err: `失敗しました(${e})` };
  }
}
// 抽出済みデータ取得
async function extractedData(e, year) {
  // mWin.webContents.send("test1", "testだよ");
  db.setYear(year);
  let recs = await db.extracted();
  console.log(recs);
  let resRecs = [];
  for (let line of recs) {
    let status = "済";
    if (!line.game_no) {
      status = "未";
      line.game_no = `${line.date_id}-${line.game_id.substr(line.game_id.length - 2, 1)}`; // 捻出
    }
    resRecs.push({ ...line, status });
  }
  return resRecs;
}
// 整形＆出力
async function convert(e, data) {
  logger.debug(data);
  let convertCls = new Convert(mWin);
  let res = {};
  try {
    await convertCls.do(data);
    let idList = [];
    Object.values(data.targetList).forEach((d) => {
      idList = idList.concat(d);
    });
    for (let tbl of ["STATS", "RESULTS"]) {
      let recs = await accessDb(null, tbl, "select", data.year, { cond: `game_id in ('${idList.join("','")}')` });
      let tmpHeader = { ...D[`${tbl}_KEY_MAP`] };
      delete tmpHeader.game_id;
      let tmpCsv = [Object.values(tmpHeader).join(",")];
      for (let rec of recs) {
        delete rec.game_id;
        tmpCsv.push(Object.values(rec));
      }
      res[tbl] = tmpCsv.join("\n");
    }
    res.ok = true;
  } catch (e) {
    logger.warn(e);
    res.err = `失敗しました。${e}`;
  }
  return res;
}
// データの抽出
async function extract(e, data) {
  logger.debug(data);
  let res = {};
  try {
    // 先にアカウントを保存
    let Web = new WebCls(mWin);
    await Web.main(data);
  } catch (e) {
    logger.warn(e);
    res.err = `失敗しました。${e}`;
  }
  return res;
}

// ファイルの末尾に追加
const server = "https://update.electronjs.org";
const feed = `${server}/msaitou/mleague_data_extract/${process.platform}-${process.arch}/${app.getVersion()}`;

if (app.isPackaged) {
  // パッケージされている（ローカル実行ではない）
  autoUpdater.setFeedURL({
    url: feed,
  });
  autoUpdater.checkForUpdates(); // アップデートを確認する

  // アップデートのダウンロードが完了したとき
  autoUpdater.on("update-downloaded", async () => {
    const returnValue = await dialog.showMessageBox({
      message: "アップデートあり",
      detail: "再起動してインストールできます。",
      buttons: ["再起動", "後で"],
    });
    if (returnValue.response === 0) {
      autoUpdater.quitAndInstall(); // アプリを終了してインストール
    }
  });

  // アップデートがあるとき
  autoUpdater.on("update-available", () => {
    mWin.webContents.send("setVersion", app.getVersion());
    dialog.showMessageBox({
      message: "アップデートがあります",
      buttons: ["OK"],
    });
  });

  // アップデートがないとき
  autoUpdater.on("update-not-available", () => {
    mWin.webContents.send("setVersion", app.getVersion());
    logger.info("アップデートはありません");
    // mWin.webContents.send("setVersion", app.getVersion());

    // dialog.showMessageBox({
    //   message: "アップデートはありません",
    //   buttons: ["OK"],
    // });
  });

  // エラーが発生したとき
  autoUpdater.on("error", () => {
    mWin.webContents.send("setVersion", app.getVersion());
    dialog.showMessageBox({
      message: "アップデートエラーが起きました",
      buttons: ["OK"],
    });
  });
}
