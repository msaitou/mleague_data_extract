const logger = require("./initter.js").log();
global.log = logger;
logger.debug(process.argv);
const conf = require("config");
const { D } = require("./lib/defain.js");
const sqliteDb = require("./sql").sqliteDb;
const { BaseWebDriverWrapper } = require("./base-webdriver-wrapper");

async function start(p) {
  return new Promise(async (resolve, reject) => {
    logger.info(33);
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
  constructor() {
    this.logger = global.log;
  }
  async main(p) {
    logger.info("main---");
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
      if (defoYear != p[2]) scheUrl += `${p[2]}-season`;
      let params = { forceFlag: { raw: false, sche: false } }; // 画面から受け取る引数
      // 必ず最初に、日程を抽出し差分を更新　引数のyear に対象の年度があるので、その年度の日程を抽出
      let db = new sqliteDb();
      db.setYear(p[2]);
      await db.init();
      // https://m-league.jp/games/2020-season　過去の場合
      let pAna = new PreAnalyzer(db, params);
      try {
        driver = await pAna.exec(scheUrl);
      } catch (e) {
        logger.warn(e);
      }
      let urls = [
        // "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0001_01A"
      ];
      // urls.push("https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0001_01A");
      // urls.push("https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0001_02A");
      let dates = ["20181002"];
      // どの試合のデータを抽出するか
      let urlMap = {};
      if (urls.length) {
        urlMap = await getUrlMapFromGameId(db, urls);
        this.logger.debug(urlMap);
      } else {
        urlMap = await getUrlMapFromDate(db, dates);
        this.logger.debug(urlMap);
      }
      // return;
      let ana = new Analyzer(db, driver, params);
      try {
        let aca = await db.select("ACCOUNT");
        if (aca.length) {
          await ana.exec(urlMap, aca[0]);
        } else throw "アカウントがないので無理です";
      } catch (e) {
        logger.warn(e);
      }
    } catch (e) {
      logger.warn(e);
    } finally {
      if (driver) await driver.quit();
    }
  }
}
// 最初の処理。DBのtableやSCHEの取得
class PreAnalyzer extends BaseWebDriverWrapper {
  params = {};
  constructor(db, params) {
    super(db);
    this.logger.info(`constructor`);
    this.params = params;
  }
  async exec(pUrl) {
    this.logger.info("きた？" + pUrl);
    let forceFlag = this.params.forceFlag; // 強制フラグ（raw:生データ取得,sche:スケジュール）
    try {
      if (!this.getDriver()) {
        this.setDriver(await this.webDriver(null, conf.chrome.headless));
      }
      let scheList = [];
      if (true) {
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
      } else {
        scheList = [
          "20221003",
          "20221004",
          "20221006",
          "20221007",
          "20221010",
          "20221011",
          "20221013",
          "20221014",
          "20221017",
          "20221018",
          "20221020",
          "20221021",
          "20221024",
          "20221025",
          "20221027",
          "20221028",
          "20221031",
          "20221101",
          "20221103",
          "20221104",
          "20221107",
          "20221108",
          "20221110",
          "20221111",
          "20221114",
          "20221115",
          "20221117",
          "20221118",
          "20221121",
          "20221122",
          "20221124",
          "20221125",
          "20221128",
          "20221129",
          "20221201",
          "20221202",
          "20221205",
          "20221206",
          "20221208",
          "20221209",
          "20221212",
          "20221213",
          "20221215",
          "20221216",
          "20221219",
          "20221220",
          "20221222",
          "20221223",
          "20230102",
          "20230103",
          "20230105",
          "20230106",
          "20230109",
          "20230110",
          "20230112",
          "20230113",
          "20230116",
          "20230117",
          "20230119",
          "20230120",
          "20230123",
          "20230124",
          "20230126",
          "20230127",
          "20230130",
          "20230131",
          "20230202",
          "20230203",
          "20230206",
          "20230207",
          "20230209",
          "20230210",
          "20230213",
          "20230214",
          "20230216",
          "20230217",
          "20230220",
          "20230221",
          "20230223",
          "20230224",
          "20230227",
          "20230228",
          "20230302",
          "20230303",
          "20230306",
          "20230307",
          "20230309",
          "20230310",
          "20230313",
          "20230314",
          "20230316",
          "20230317",
          "20230320",
        ];
      }
      // TODO SCHEを強制更新する引数があれば、すべてdeleteしてから全部インサート、
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
        this.logger.info("SCHEを更新しました。");
      }
    } catch (e) {
      this.logger.info(e);
      await this.quitDriver();
    }
    return this.driver;
  }
}
class Analyzer extends BaseWebDriverWrapper {
  baseUrl = "https://m-league.jp/games/";
  params = {};
  constructor(db, driver, params) {
    super(db);
    this.setDriver(driver);
    this.logger.info(`constructor`);
    this.params = params;
  }
  async exec(urlMap, aca) {
    this.logger.info("きた？" + urlMap);
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
              if (new Date().getTime() - new Date(tmp[0].date) > 60 * 60 * 1000) reFlag = false;
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
                this.logger.debug(result);
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
        }
      }
    } catch (e) {
      this.logger.info(e);
    }
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
// TODO SEASONの情報は、GUI側から登録するように
// gameIdから日程(YYYYMMDD)を返す
async function getUrlMapFromGameId(db, urls) {
  let urlsMap = {},
    tmpMap = {};
  for (let url of urls) {
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
if (process.argv.length > 2) {
  start(process.argv);
} else logger.warn("引数が足りません");
