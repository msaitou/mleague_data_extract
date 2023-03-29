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
  ipcMain.handle("extractedData", extractedData); // プロセス間通信
  ipcMain.handle("convert", convert); // プロセス間通信
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
const logger = require("../initter.js").log();
global.log = logger;
const conf = require("config");
const { sqliteDb } = require("../sql.js");
const { Convert } = require("../convert.js");
const db = new sqliteDb();
const { D } = require("../lib/defain.js");
async function accessDb(e, tName, method, year, params = {}) {
  logger.info(tName, method, params);
  if (year) db.setYear(year);
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
}
async function extractedData(e, year) {
  mWin.webContents.send("test1","testだよ");
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
async function convert(e, data) {
  logger.debug(data);
  let convertCls = new Convert();
  let res = {};
  try {
    await convertCls.do(data);
    let idList = [];
    Object.values(data.targetList).forEach((d) => {
      idList = idList.concat(d);
    });
    for (let tbl of ["STATUS", "RESULTS"]) {
      let recs = await accessDb(null, tbl, "select", data.year, { cond: `game_id in ('${idList.join("','")}')` });
      let tmpHeader = D[`${tbl}_KEY_MAP`];
      delete tmpHeader.game_id;
      let tmpCsv = [Object.values(tmpHeader).join(",")];
      for(let rec of recs) {
        delete rec.game_id;
        tmpCsv.push(Object.values(rec));
      }
      res[tbl] = tmpCsv.join("\n");
    }
    mWin.webContents.send("test1","testだよ");
    res.ok = true;
  } catch (e) {
    logger.warn(e);
    res.ng = `失敗しました。${e}`;
  }
  return res;
}
