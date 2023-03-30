const logger = require("./initter.js").log();
const DispLog = require("./initter.js").DispLog;
global.log = logger;
logger.debug(process.argv);
const conf = require("config");
const { D } = require("./lib/defain.js");
const sqliteDb = require("./sql").sqliteDb;
const { BaseWebDriverWrapper } = require("./base-webdriver-wrapper");

async function start(p) {
  return new Promise(async (resolve, reject) => {
    logger.info("START^-------------");
    let Web = new WebCls();
    await Web.main(p);
    resolve(true);
  })
    .then((res) => {
      logger.info("res", res);
    })
    .catch((e) => {
      logger.error(e);
    })
    .finally(() => {
      logger.info("END--------------");
      process.exit();
    });
}

class WebCls {
  logger;
  dispLog;
  constructor(mWin) {
    this.logger = global.log;
    this.dispLog = new DispLog(this.logger, mWin);
  }
  async main(p) {
    this.dispLog.info("■■データ取得処理開始■■", JSON.stringify(p));
    let driver = null;
    try {
      logger.debug(p);

      let today = new Date();
      let baseDay = new Date();
      baseDay.setMonth(8); // monthは-1しないと正しくない
      baseDay.setDate(20);
      // 今日が9/20以前なら、去年。以降なら今年（current　というかdefault）の年度扱いにする。
      let scheUrl = "https://m-league.jp/games/"; // defaultのURL
      let defoYear = baseDay.getFullYear();
      if (today < baseDay) defoYear--;
      if (defoYear != p.year) scheUrl += `${p.year}-season`;
      let params = { forceFlag: { raw: p.reconvert_raw, sche: p.reconvert_sche } }; // 画面から受け取る引数
      // 必ず最初に、日程を抽出し差分を更新　引数のyear に対象の年度があるので、その年度の日程を抽出
      let db = new sqliteDb();
      db.setYear(p.year);
      await db.init();
      // https://m-league.jp/games/2020-season　過去の場合
      let pAna = new PreAnalyzer(db, params, this.dispLog);
      try {
        driver = await pAna.exec(scheUrl);
      } catch (e) {
        logger.warn(e);
      }
      let urlMap = {};
      // p["targets"] = [
      //   // "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0001_01A"
      // ];
      // // = [
      // //   // "20181002"
      // // ];
      // どの試合のデータを抽出するか
      switch (p.kind) {
        case "URL":
          urlMap = await getUrlMapFromGameId(db, p.targets);
          this.logger.debug(urlMap);
          break;
        case "日付(YYYYMMDD)":
          urlMap = await getUrlMapFromDate(db, p.targets);
          this.logger.debug(urlMap);
          break;
        case "取得可能全て":
          let sches = await db.select("SCHE");
          let dates = sches.reduce((p, c) => {
            p.push(c.data);
            return p;
          }, []);
          urlMap = await getUrlMapFromDate(db, dates);
          this.logger.debug(urlMap);
          break;
        default:
          throw "抽出対象が不明です";
      }
      let ana = new Analyzer(db, driver, params, this.dispLog);
      try {
        let aca = await db.select("ACCOUNT");
        if (aca.length) {
          await ana.exec(urlMap, aca[0]);
        } else throw "アカウントがないので無理です";
      } catch (e) {
        logger.warn(e);
        throw e;
      }
    } catch (e) {
      logger.warn(e);
      this.dispLog.warn(e);
      throw e;
    } finally {
      if (driver) await driver.quit();
      this.dispLog.info("■■データ取得処理終了■■");
    }
  }
}
// 最初の処理。DBのtableやSCHEの取得
class PreAnalyzer extends BaseWebDriverWrapper {
  params = {};
  dispLog;
  constructor(db, params, dispLog) {
    super(db);
    this.logger.info(`constructor`);
    this.params = params;
    this.dispLog = dispLog;
  }
  async exec(pUrl) {
    this.logger.info("きた？" + pUrl);
    this.dispLog.info("■スケジュールの取得開始■");
    let forceFlag = this.params.forceFlag; // 強制フラグ（raw:生データ取得,sche:スケジュール）
    try {
      if (!this.getDriver()) {
        this.setDriver(await this.webDriver(null, conf.chrome.headless));
      }
      let scheList = [];
      await this.driver.get(pUrl); // このページを解析
      // let page = await this.driver.getPageSource();
      // logger.info(page);
      let se = ["div.c-modal2"];
      let els = await this.driver.executeScript(`return document.querySelectorAll('${se[0]}');`);
      for (let el of els) {
        let id = await el.getAttribute("id");
        let key = id.split("key")[1];
        let reg = /^\d{8}$/;
        if (reg.test(key)) scheList.push(key);
      }
      this.logger.debug(scheList);
      // 今取り込み済みのSCHEデータを取得して、そこに含まれていないデータのみインサート
      let recs = await this.db.select("SCHE");
      let orede_no_offset = 1; // 最初は1
      if (recs.length && !forceFlag.sche) {
        this.logger.debug(recs);
        // 重複は間引く
        recs.forEach((r) => {
          let matchIndex = scheList.indexOf(r.date);
          if (matchIndex > -1) scheList.splice(matchIndex, 1);
        });
      }
      if (scheList.length) {
        scheList.sort(); // 文字列の昇順に並び替え
        let savedRec = [];
        scheList.forEach((date, i) => {
          savedRec.push([date, i + orede_no_offset]);
        });
        await this.db.insert("SCHE", savedRec);
        this.dispLog.info("-> SCHEを更新しました。");
      }
      else this.dispLog.info("-> 更新するSCHEはありませんでした。");
    } catch (e) {
      this.dispLog.warn(e);
      await this.quitDriver();
    }
    this.dispLog.info("■スケジュールの取得終了■");
    return this.driver;
  }
}
class Analyzer extends BaseWebDriverWrapper {
  baseUrl = "https://m-league.jp/games/";
  params = {};
  dispLog;
  constructor(db, driver, params, dispLog) {
    super(db);
    this.setDriver(driver);
    this.logger.info(`constructor`);
    this.params = params;
    this.dispLog = dispLog;
  }
  async exec(urlMap, aca) {
    this.dispLog.info("■対象データの抽出開始■" ,JSON.stringify(urlMap));
    let forceFlag = this.params.forceFlag; // 強制フラグ（raw:生データ取得,sche:スケジュール）
    try {
      if (!this.getDriver()) this.setDriver(await this.webDriver());
      await this.openUrl(this.baseUrl);
      await this.sleep(1000);
      let se = ["div.p-loginMenu", "#mail", "#password", "div.p-loginMenu__btn> button", "p.js-personalMenu__title"];
      let username = await this.driver.executeScript(`return document.querySelectorAll('${se[4]}')[0].textContent;`);
      if (!username) {
        // ログインが必要
        let els = await this.driver.executeScript(`return document.querySelectorAll('${se[0]}');`);
        if (els.length) {
          await this.driver.executeScript(`arguments[0].setAttribute('style', 'display:block;');`, els[0]);
          if (await this.isExistEle(se[1], true, 1000)) {
            // アカウント（メール）入力
            let inputEle = await this.getEle(se[1], 500);
            await inputEle.clear();
            await inputEle.sendKeys(aca.id);
            // パスワード入力
            inputEle = await this.getEle(se[2], 500);
            await inputEle.clear();
            await inputEle.sendKeys(aca.password);
            let el = await this.getEle(se[3], 1000);
            await this.clickEle(el, 4000, 100);
            // 多分ログインできてるはず
            let tmp = await this.db.select("TMP"); // 一回やれば、しばらくキャッシュされるので、１２時間過ぎたらやり直してみる
            let reFlag = true;
            if (tmp.length && tmp[0].date) {
              if (new Date().getTime() - new Date(tmp[0].date) < 12 * 60 * 60 * 1000) reFlag = false;
            }
            if (reFlag) {
              // 最初だけちゃんと画面を操作して開く必要あり
              await this.openUrl("https://m-league.jp/games/2018-season"); // URLが変わらなそうなページ
              se = ["'#js-modal-key20181001'", "#js-modal-key20181001 form>button", "script:not([src]):not([type])"];
              await this.driver.executeScript(
                `document.querySelectorAll(${se[0]})[0].setAttribute('style', 'display:block;');`
              );
              if (await this.isExistEle(se[1], true, 1000)) {
                let els = await this.getEles(se[1], 500);
                await this.clickEle(els[0], 4000);
                // 別タブが開くので、切り替えて、少し待って、ページを閉じる
                let wid = await this.driver.getWindowHandle();
                await this.changeWindow();
                if (await this.isExistEle(se[2], true, 3000)) {
                  // これで直URLでも見れるはず
                  await this.driver.close();
                  await this.driver.switchTo().window(wid); // 元ページをアクティブに
                } else throw "牌譜ビューアが表示されてません";
              }
              await this.db.delete("TMP");
              await this.db.insert("TMP", [[new Date().toISOString()]]);
            }
          }
        }
      }
      //  すでに抽出済みのデータはスキップする（強制フラグがあればやらない）
      let existsGameIdList = [];
      if (!forceFlag.raw) existsGameIdList = await this.db.select("RAW", null, "distinct game_id");

      se = ["script:not([src]):not([type])"];
      let wid = this.driver.getWindowHandle();
      for (let [dateId, gameList] of Object.entries(urlMap)) {
        for (let game of gameList) {
          let currentGameId = game.game_id;
          if (!forceFlag.raw && existsGameIdList.filter((g) => g.game_id == currentGameId).length) continue;
          //  すでに抽出済みのデータはスキップする（強制フラグがあればやらない）
          await this.driver.switchTo().newWindow("tab");
          await this.changeWindow();
          await this.openUrl(game.url);
          // let page = await this.driver.getPageSource();
          // this.logger.info(page);
          if (await this.isExistEle(se[0], true, 2000)) {
            let preStr = await this.driver.executeScript(
              `return document.querySelectorAll('${se[0]}')[0].textContent;`
            );
            // this.logger.info(text);
            for (let line of preStr.split("\n")) {
              if (line.indexOf("UMP_PLAYER.init(") > -1) {
                let target = line.substring(line.indexOf("'[{") + 1, line.lastIndexOf("}]'") + "}]'".length - 1);
                let result = JSON.parse(target);
                target = undefined; // メモリ節約できるかな
                // this.logger.debug(result);
                let saveRec = [];
                result.forEach((r) => {
                  saveRec.push([currentGameId, dateId, r.time, r.id, r.cmd, JSON.stringify(r.args)]);
                });
                await this.db.insert("RAW", saveRec);
                break;
              }
            }
          }
          await this.driver.close(); // このタブを閉じて
          await this.driver.switchTo().window(wid); // 元のウインドウIDにスイッチ
          this.dispLog.info(`${dateId}の ${currentGameId} のデータ抽出完了`);
        }
      }
    } catch (e) {
      this.dispLog.warn(e);
    }
    this.dispLog.info("■対象データの抽出終了■" );
    return this.driver;
  }
}
// 日程(YYYYMMDD)からgameIdを返す(2つあり)
async function getUrlMapFromDate(db, dates) {
  let urlsMap = {};
  let seasonRecs = await db.select("SEASON", `year = "${db.year}"`);
  if (!seasonRecs.length) throw `${db.year}シーズンのURL情報が見つかりません。`;
  seasonRecs.sort((a, b) => {
    return a.start_date < b.start_date ? -1 : 1; //オブジェクトの昇順ソート
  }); // 破壊的
  let scheRecs = await db.select("SCHE");
  if (!scheRecs.length) throw `スケジュールが見つかりません`;

  for (let dateStr of dates) {
    if (!dateStr) continue;
    let targetSeason = "";
    for (let rec of seasonRecs) {
      // 後が優先（R<S<F）
      if (rec.start_date <= dateStr) targetSeason = rec;
    }
    if (targetSeason.start_date) `${db.year}シーズンのURL情報が見つかりません。(開始日)`;

    let targetScheRecs = scheRecs.filter((s) => s.date >= targetSeason.start_date);
    if (!targetScheRecs.length) throw `対応するスケジュールが見つかりません`;
    let order = 0;
    for (let i in targetScheRecs) {
      if (targetScheRecs[i].date == dateStr) {
        order = Number(i) + 1;
        break;
      }
    }
    if (!order) throw `対応するスケジュールが見つかりません（範囲外）`;
    let gameIdCommon = `${targetSeason.url_key}_${order.toString().padStart(4, "0")}_`;
    let gameList = [];
    for (let key of ["01A", "02A"]) {
      let game_id = `${gameIdCommon}${key}`;
      gameList.push({ game_id, url: `https://viewer.ml-log.jp/web/viewer?gameid=${game_id}` });
    }
    urlsMap[dateStr] = gameList;
  }
  return urlsMap;
}
// gameIdから日程(YYYYMMDD)を返す
async function getUrlMapFromGameId(db, urls) {
  let urlsMap = {},
    tmpMap = {};
  for (let url of urls) {
    if (!url) continue;
    let game_id = url.substr(url.lastIndexOf("=") + 1);
    if (!game_id) throw `対象外のURLが含まれています（${url}）`;
    let tmpKey = game_id.substring(0, game_id.lastIndexOf("_")); // 仮のキー。dateと対応
    if (!(tmpKey in tmpMap)) tmpMap[tmpKey] = [];
    tmpMap[tmpKey].push({ game_id, url });
  }
  let seasonRecs = await db.select("SEASON", `year = "${db.year}"`);
  if (!seasonRecs.length) throw `${db.year}シーズンのURL情報が見つかりません。`;
  let scheRecs = await db.select("SCHE");
  if (!scheRecs.length) throw `スケジュールが見つかりません`;

  for (let [tmpKey, gameList] of Object.entries(tmpMap)) {
    let tmpArr = tmpKey.split("_");
    let seasonKey = `${tmpArr[0]}_${tmpArr[1]}`; // url_key
    let order = tmpArr[2]; // これがscheで抽出したレコードの順番に対応するはず
    let targetSeasonRecs = seasonRecs.filter((s) => s.url_key == seasonKey);
    if (!targetSeasonRecs.length) throw `${db.year}シーズンのURL情報が見つかりません。(${seasonKey})`;

    let targetScheRecs = scheRecs.filter((s) => s.date >= targetSeasonRecs[0].start_date);
    if (targetScheRecs.length < Number(order) - 1) throw `対応するスケジュールが見つかりません（範囲外）`;
    urlsMap[targetScheRecs[Number(order) - 1].date] = gameList;
  }
  return urlsMap;
}
exports.WebCls = WebCls;

if (process.argv.length > 2) {
  // {
  //   kind: "日付(YYYYMMDD)";or URL 取得可能全て
  //   reconvert_raw: false;
  //   reconvert_sche: false;
  //   targets: ["20181004"];
  //   year: "2018";
  // }
  start({ year: process.argv[2], targetList: process.argv[3], reconvert: process.argv[4] });
} else if (process.argv[0].indexOf("electron") > -1) {
  // electronから呼ばれたら無視
} else logger.warn("引数が足りません");
