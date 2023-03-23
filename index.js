const logger = require("./initter.js").log();
global.log = logger;
logger.debug(process.argv);
const conf = require("config");
const fs = require("fs");
const { D } = require("./lib/defain.js");
const sqliteDb = require("./sql").sqliteDb;
const { Builder, By, until, Select, Key } = require("selenium-webdriver");
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
      // let preStr = { items: await db.select("ITEMS") };
      // let aca = await db.select("ACCOUNT");
      // preStr["account"] = aca[0];
      // let setting = JSON.parse(preStr);

      // let setting = preStr;
      // if (setting.items && setting.account) {
      let today = new Date();
      let baseDay = new Date();
      baseDay.setMonth(8); // monthは-1しないと正しくない
      baseDay.setDate(20);
      // 今日が9/20以前なら、去年。以降なら今年（current　というかdefault）の年度扱いにする。
      let scheUrl = "https://m-league.jp/games/"; // defaultのURL
      let defoYear = baseDay.getFullYear();
      if (today < baseDay) defoYear--;
      if (defoYear != p[2]) scheUrl += `${p[2]}-season`;
      // 必ず最初に、日程を抽出し差分を更新　引数のyear に対象の年度があるので、その年度の日程を抽出
      let db = new sqliteDb(p[2]);
      await db.init();
      // https://m-league.jp/games/2020-season　過去の場合
      let pAna = new PreAnalyzer(db);
      try {
        driver = await pAna.exec(scheUrl);
      } catch (e) {
        logger.warn(e);
      }
      let urls = [
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0002_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0002_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0003_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0003_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0004_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0004_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0005_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0005_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0006_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0006_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0007_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0007_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0008_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0008_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0009_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0009_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0010_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0010_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0011_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0011_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0012_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0012_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0013_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0013_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0014_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0014_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0015_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0015_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0016_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0016_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0017_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0017_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0018_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0018_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0019_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0019_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0020_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0020_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0021_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0021_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0022_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0022_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0023_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0023_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0024_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0024_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0025_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0025_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0026_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0026_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0027_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0027_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0028_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0028_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0029_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0029_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0030_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0030_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0031_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0031_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0032_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0032_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0033_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0033_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0034_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0034_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0035_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0035_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0036_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0036_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0037_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0037_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0038_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0038_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0039_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0039_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0040_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0040_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0041_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0041_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0042_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0042_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0043_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0043_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0044_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0044_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0045_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0045_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0046_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0046_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0047_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0047_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0048_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0048_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0049_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0049_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0050_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0050_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0051_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0051_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0052_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0052_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0053_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0053_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0054_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0054_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0055_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0055_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0056_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0056_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0057_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0057_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0058_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0058_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0059_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0059_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0060_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0060_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0061_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0061_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0062_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0062_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0063_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0063_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0064_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0064_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0065_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0065_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0066_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0066_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0067_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0067_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0068_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0068_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0069_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0069_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0070_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0070_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0071_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0071_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0072_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0072_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0073_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0073_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0074_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0074_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0075_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0075_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0076_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0076_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0077_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0077_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0078_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0078_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0079_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0079_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0080_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0080_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0081_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0081_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0082_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0082_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0083_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0083_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0084_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0084_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0085_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0085_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0086_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0086_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0087_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0087_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0088_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0088_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0089_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0089_02A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0090_01A",
        "https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0090_02A",
      ];
      // urls.push("https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0001_01A");
      // urls.push("https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0001_02A");
      // どの試合のデータを抽出するか
      let urlMap = {};
      if (urls.length) {
        // セミファイナル、ファイナルの開始日によって場合分け　TODO
        urlMap = await getUrlMapFromDate(db, urls);
        this.logger.debug(urlMap);
      } else {
      }
      // return;
      let ana = new Analyzer(db, driver);
      try {
        let aca = await db.select("ACCOUNT");
        if (aca.length) {
          await ana.exec(urlMap, aca[0]);
        } else throw "アカウントがないので無理です";
      } catch (e) {
        logger.warn(e);
      }
      // let task = setting.items.filter((it) => it.book_date == today.toLocaleDateString())[0];
      // logger.info(task);
      // if (task) {
      //   const ana = new Analyzer();
      //   await ana.exec(task, setting.account);
      // }
    } catch (e) {
      logger.warn(e);
    } finally {
      if (driver) await driver.quit();
    }
  }
}
// 最初の処理。DBのtableやSCHEの取得
class PreAnalyzer extends BaseWebDriverWrapper {
  constructor(db) {
    super(db);
    this.logger.info(`constructor`);
  }
  async exec(pUrl) {
    this.logger.info("きた？" + pUrl);
    try {
      if (!this.getDriver()) {
        this.setDriver(await this.webDriver(null, conf.chrome.headless));
      }
      let scheList = [];
      if (false) {
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
        this.logger.info(scheList);
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
      let forceFlag = false; // 強制の場合は下をスキップ
      if (recs.length && !forceFlag) {
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
  constructor(db, driver) {
    super(db);
    this.setDriver(driver);
    this.logger.info(`constructor`);
  }
  async exec(urlMap, aca) {
    this.logger.info("きた？" + urlMap);
    try {
      if (!this.getDriver()) this.setDriver(await this.webDriver());
      await this.openUrl(this.baseUrl);
      await this.sleep(2000);
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
          }
        }
      }
      se = ["script:not([src]):not([type])"];
      let wid = this.driver.getWindowHandle();
      for (let [dateId, gameList] of Object.entries(urlMap)) {
        for (let game of gameList) {
          let currentGameId = game.game_id;
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
      // let preStr = fs.readFileSync("./log/test.txt", "utf8");
      // preStr.split("\n").forEach((line) => {
      //   if (line.indexOf("UMP_PLAYER.init(") > -1) {
      //     let target = line.substring(line.indexOf("'[{"), line.lastIndexOf("}]'") + "}]'".length);
      //     target = target.replaceAll("'", "");
      //     let result = JSON.parse(target);
      //     this.logger.info(result);
      //   }
      // });

      if (false) {
        let member = [],
          narabi = [],
          memberKeyList = [],
          kyokuStats = [],
          results = [];
        let getMid = (name) => {
          return member.filter((m) => m.last == name || m.first == name)[0];
        };
        let getHiniti = (b) => {
          return `${b.substr(0, 4)}/${Number(b.substr(4, 2)).toString()}/${Number(b.substr(6, 2)).toString()}`;
        };
        let getSeason = (day) => {
          let mark = "R";
          if (conf.semi.indexOf(day) > -1) mark = "S";
          else if (conf.final.indexOf(day) > -1) mark = "F";
          return conf.year[0] + mark;
        };

        if (true) {
          await this.driver.get(`${this.baseUrl}${urlMap}`); // このページを解析
          let se = ["div.entry-content strong,div.entry-content b"];
          // 必要な情報を取り合えず全部取得
          if (await this.isExistEle(se[0], true, 3000)) {
            let els = await this.getEles(se[0], 3000);
            for (let i = 0; i < els.length; i++) {
              let text = await els[i].getText();
              text = text.trim();
              let regex = "[東南](\\d)局";
              let matches = text.match(regex);
              // logger.info(`${matches[1]}は、`);
              if (text.indexOf("vs") > -1) {
                // vs 4人を決める
                let tmpMens = MEMBER_LIST.filter(
                  (m) => text.indexOf(m.full2) > -1 || (m.full3 && text.indexOf(m.full3) > -1)
                );
                tmpMens.forEach((t) => {
                  memberKeyList.push(t.last);
                  memberKeyList.push(t.first);
                });
                member = member.concat(tmpMens);
              } else if (matches && matches.length > 1) {
                let oya = memberKeyList.filter((m) => text.indexOf(m) > -1)[0];
                if (narabi.filter((m) => m?.no == getMid(oya).no).length === 0) narabi.push(getMid(oya)); // 席順
                // 東、南?局　が先頭の行から次に出てくる東までを判断
                // その1局の情報として解析
                let recs = [text];
                for (let j = 1; j < 5; j++) {
                  let text2 = await els[i + j].getText();
                  text2 = text2.trim();
                  regex = "[東南](\\d)局";
                  matches = text2.match(regex);
                  if ((matches && matches.length > 1) || text2.indexOf("結果") > -1) {
                    // この直前までを1つの局として扱う
                    i += j - 1;
                    break;
                  } else {
                    regex = `^(${memberKeyList.concat("全員").join("|")})`;
                    matches = text2.match(regex);
                    if (matches && matches.length) {
                      // 最初の文字がメンバーの場合追加
                      recs.push(text2);
                    } else recs[recs.length - 1] += text2; // 改行されてるので結合
                  }
                }
                kyokuStats.push(recs);
                // 繰り返す　次の行が　結果　になるまで
              } else if (text.indexOf("結果") > -1) {
                // 結果が着たら、2行単位で順位を解析
                let resUnit = {};
                for (let j = 1; j < 9; j++) {
                  let text2 = await els[i + j].getText();
                  text2 = text2.trim();
                  let regex1 = "^(\\d). ";
                  let regex2 = "^(-?\\d+)点";
                  let matches1 = text2.match(regex1);
                  let matches2 = text2.match(regex2);
                  if (matches1 && matches1.length) {
                    let m = memberKeyList.filter((m) => text2.indexOf(m) > -1)[0];
                    let mm = MEMBER_LIST.filter((m1) => m1.last === m || m1.first === m)[0];
                    resUnit = { order: matches1[1], no: mm.no, teamId: mm.teamId };
                  } else if (matches2 && matches2.length) {
                    resUnit.ten = matches2[1];
                    results.push(resUnit);
                  }
                }
              }
            }
            this.logger.debug(member, memberKeyList, kyokuStats, results);
          }
        } else {
          (member = [
            {
              no: "M-001",
              full2: "鈴木たろう",
              last: "鈴木",
              first: "たろう",
              full: "鈴木 たろう",
              teamId: "T-6",
              teamName: "赤坂ドリブンズ",
            },
            {
              no: "M-014",
              full2: "松ヶ瀬隆弥",
              last: "松ヶ瀬",
              first: "隆弥",
              full: "松ヶ瀬 隆弥",
              teamId: "T-8",
              teamName: "EX風林火山",
            },
            {
              no: "M-002",
              full2: "堀慎吾",
              last: "堀",
              first: "慎吾",
              full: "堀 慎吾",
              teamId: "T-3",
              teamName: "KADOKAWAサクラナイツ",
            },
            {
              no: "M-004",
              full2: "日向藍子",
              last: "日向",
              first: "藍子",
              full: "日向 藍子",
              teamId: "T-2",
              teamName: "渋谷ABEMAS",
            },
          ]),
            (memberKeyList = ["鈴木", "たろう", "松ヶ瀬", "隆弥", "堀", "慎吾", "日向", "藍子"]),
            (kyokuStats = [
              ["東1局（親　たろう）ドラ 8ピン", "松ヶ瀬（ツモ上がり）リーチ ツモ 東 ドラ1（満貫）2000点 4000点"],
              ["東2局（親　堀）ドラ 5索", "たろう（ツモ上がり）リーチ ツモ 中 ドラ1（満貫）2000点 4000点"],
              ["東3局（親　松ヶ瀬）ドラ 發", "日向（松ヶ瀬からロン上がり）リーチ ピンフ ドラ1　3900点"],
              ["東4局（親　日向）ドラ 南", "たろう（堀からロン上がり）南 ドラ3（満貫）8000点"],
              ["南1局（親　たろう）ドラ 9萬", "たろう 堀 日向 テンパイ　流局"],
              [
                "南1局（親　たろう）1本場 供託1 ドラ 5萬",
                "堀（松ヶ瀬からロン上がり）リーチ ピンフ ドラ1 赤2（満貫）8000点　1本場 300点",
              ],
              ["南2局（親　堀）ドラ 3索", "たろう（堀からロン上がり）中　1300点"],
              ["南3局（親　松ヶ瀬）ドラ 白", "日向（堀からロン上がり）リーチ　1300点"],
              ["南4局（親　日向）ドラ 5索", "日向 テンパイ　流局"],
              [
                "南4局（親　日向）1本場 供託1 ドラ 3ピン",
                "日向（ツモ上がり）リーチ ツモ ピンフ 赤1 裏ドラ1（満貫）4000点　1本場 100点オール",
              ],
              [
                "南4局（親　日向）2本場 ドラ 5ピン",
                "たろう（日向からロン上がり）タンヤオ ドラ1 赤1　5200点　2本場 600点",
              ],
            ]),
            (results = [
              { order: "1", no: "M-001", teamId: "T-6", ten: "40000" },
              { order: "2", no: "M-004", teamId: "T-2", ten: "35400" },
              { order: "3", no: "M-002", teamId: "T-3", ten: "14900" },
              { order: "4", no: "M-014", teamId: "T-8", ten: "9700" },
            ]);
        }
        // エラーぽい奴のインフォ
        if (results.length !== 4) this.logger.info(`${urlMap}の結果が${results.length}`);
        if (member.length !== 4) this.logger.info(`${urlMap}のメンバが${member.length}`);
        if (kyokuStats.length < 8) this.logger.info(`${urlMap}の局が${kyokuStats.length}`);
        // 必要な項目は計算して1試合分のデータを整形

        // var resultTemp = {
        //   試合No: "",
        //   日にち: "",
        //   シーズン: "",
        //   TeamID: "",
        //   登板選手: "",
        //   選手名: "",
        //   ポイント: "",
        //   保有点: "",
        //   着順: "",
        // };
        let statsRecs = [];
        let nowPoints = {}; // 今の持ち点
        narabi.forEach((m) => (nowPoints[m.no] = 25000));
        for (let stats of kyokuStats) {
          let oya = "";
          let kyoutaku = "";
          let base = {};
          let tumiBa = "";
          for (let i in stats) {
            let line = stats[i];
            if (i == 0) {
              let regexs = ["([東南])(\\d)局", "(\\d+)本場", "供託(\\d+)"];
              let m1 = line.match(regexs[0]);
              let m2 = line.match(regexs[1]);
              let m3 = line.match(regexs[2]);
              oya = memberKeyList.filter((m) => line.indexOf(m) > -1)[0];
              tumiBa = m2 ? m2[1] : "";
              if (m3) kyoutaku = m3[1];
              let kyoku = KYOKU_LIST.filter(
                (k) => k.no == `${m1[1] == "東" ? "t" : "n"}-${m1[2]}-${m2 ? m2[1] : "0"}`
              )[0];
              base = {
                ...statsTemp,
                試合No: urlMap,
                日にち: getHiniti(urlMap),
                局No: kyoku.no,
                局: kyoku.name,
              };
            } else {
              let pointer = memberKeyList.filter((m) => line.indexOf(m) > -1);
              let pMap = [];
              let yaku = [];
              let tumi = "";
              if (line.indexOf("ツモ上がり") > -1 || line.indexOf("ツモがり") > -1) {
                let regexs = [/\d本場\s?(\d+)点(?:オール)?/, /(\d+)点/g];
                let matches = line.match(regexs[0]); // 積み棒
                if (matches && matches.length > 0 && tumiBa) {
                  tumi = matches[1];
                  line = line.replace(regexs[0], "");
                }
                if (tumiBa) tumi = String(Number(tumiBa) * 100);
                matches = line.matchAll(regexs[1]);
                let matcheList = Array.from(matches); // 配列に変換
                if (matcheList.length === 1) {
                  // ○○オール
                  pMap.push({
                    key: pointer[0],
                    mNo: getMid(pointer[0]).no,
                    income: String(Number(matcheList[0][1]) * 3),
                  }); // 貰う点数
                  member.forEach((m) => {
                    if (m.no != getMid(pointer[0]).no) pMap.push({ mNo: m.no, income: `-${matcheList[0][1]}` }); // 払う点数
                  });
                } else if (matcheList && matcheList.length === 2) {
                  let pChild = matcheList[0][1],
                    pParent = matcheList[1][1];
                  if (Number(pChild) > Number(pParent)) (pChild = matcheList[1][1]), (pParent = matcheList[0][1]);
                  pMap.push({
                    mNo: getMid(pointer[0]).no,
                    key: pointer[0],
                    income: String(Number(pChild) * 2 + Number(pParent)),
                  }); // 貰う点数
                  member.forEach((m) => {
                    // 例外でmNoを持つ 和了者以外
                    if (m.no != getMid(pointer[0]).no)
                      pMap.push({ mNo: m.no, income: `-${m.no == getMid(oya).no ? pParent : pChild}` }); // 払う点数
                  });
                }
                line = line.replaceAll(regexs[1], "");
                yaku = line.split("）")[1].split("（")[0].split(" ");
                // } else if (line.indexOf("テンパイ") > -1) {
                //   yaku.push("流局");
                //   pointer.forEach((p) => pMap.push({ key: p, mNo: getMid(p).no, income: String(3000 / pointer.length) }));
                //   memberKeyList.forEach((m) => {
                //     if (pointer.indexOf(m) === -1)
                //       pMap.push({ key: m, mNo: getMid(m).no, income: `-${String(3000 / (4 - pointer.length))}` });
                //   });
              } else if (line.indexOf("流局") > -1 || line.indexOf("テンパイ") > -1 || line.indexOf("ノーテン") > -1) {
                if (line.indexOf("テンパイ") > -1) yaku.push("テンパイ");
                else yaku.push("ノーテン");
                if (pointer.length) {
                  pointer.forEach((p) =>
                    pMap.push({ key: p, mNo: getMid(p).no, income: String(3000 / pointer.length) })
                  );
                  memberKeyList.forEach((m) => {
                    if (pointer.indexOf(m) === -1)
                      pMap.push({ key: m, mNo: getMid(m).no, income: `-${String(3000 / (4 - pointer.length))}` });
                  });
                } else {
                  memberKeyList.forEach((m) => {
                    pMap.push({ key: m, mNo: getMid(m).no, income: 0 });
                  });
                }
              } else if (
                line.indexOf("からロン上がり") > -1 ||
                line.indexOf("から上がり") > -1 ||
                line.indexOf("上がり") > -1
              ) {
                let regexs = [
                  `(${memberKeyList.join("|")})(?:から)?(?:ロン)?(?:.)?上がり`,
                  /\d本場 (\d+)点/,
                  /(\d+)点/g,
                ];
                let m1 = line.match(regexs[0]);
                pointer = pointer.filter((p) => p != m1[1]); //  上がりの人
                // debtor.push(m1[1]); // ロンされた人
                let matches = line.match(regexs[1]); // 積み棒
                if (matches && matches.length > 0 && tumiBa) {
                  tumi = matches[1];
                  line = line.replace(regexs[1], "");
                }
                if (tumiBa) tumi = String(Number(tumiBa) * 300);
                matches = line.matchAll(regexs[2]);
                let matcheList = Array.from(matches); // 配列に変換
                pMap.push({ key: pointer[0], mNo: getMid(pointer[0]).no, income: matcheList[0][1] }); // 貰う点数
                pMap.push({ key: m1[1], mNo: getMid(m1[1]).no, income: `-${matcheList[0][1]}` }); // 払う点数
                line = line.replaceAll(regexs[2], "");
                yaku = line.split("）")[1].split("（")[0].split(" ");
              } else this.logger.info("上がり不明");
              narabi.forEach((m) => {
                let statsRec = { ...base, 選手No: m.no, TeamID: m.teamId, 選手名: m.full };
                let currentP = pMap.filter((p) => p.mNo === m.no)[0];
                if (["テンパイ", "ノーテン"].indexOf(yaku[0]) > -1) {
                  if (Number(currentP.income) > 1) statsRec["結果"] = "流局聴牌";
                  else if (Number(currentP.income) === 0)
                    statsRec["結果"] = yaku[0] == "テンパイ" ? "流局聴牌" : "流局不聴";
                  else statsRec["結果"] = "流局不聴";
                  statsRec["和了点"] = "0";
                  statsRec["聴牌料"] = currentP.income;
                  statsRec["局収支"] = currentP.income;
                  statsRec["持ち点"] = String(nowPoints[m.no] + Number(statsRec["局収支"]));
                  nowPoints[m.no] = Number(statsRec["持ち点"]);
                } else if (pMap.length == 2) {
                  // ロン
                  if (currentP) {
                    if (Number(currentP.income) > 1) {
                      statsRec["結果"] = "出和了り";
                      statsRec["和了点"] = currentP.income;
                      statsRec["打点"] = currentP.income;
                      statsRec["供託"] = Number(kyoutaku) ? String(Number(kyoutaku) * 1000) : "";
                      statsRec["積み棒"] = tumi;
                      statsRec["和了"] = "和了";
                      statsRec["役"] = yaku.join("、").trim();
                      statsRec["立直"] = yaku.indexOf("リーチ") > -1 || yaku.indexOf("立直") > -1 ? "立直" : "NO";
                      statsRec["局収支"] = currentP.income;
                    } else
                      (statsRec["結果"] = "放銃"),
                        (statsRec["和了点"] = currentP.income),
                        (statsRec["積み棒"] = tumi ? `-${tumi}` : ""),
                        (statsRec["局収支"] = currentP.income);
                  } else (statsRec["結果"] = "横移動"), (statsRec["和了点"] = "0");
                  if (statsRec["供託"])
                    statsRec["局収支"] = String(Number(statsRec["局収支"]) + Number(statsRec["供託"]));
                  if (statsRec["積み棒"])
                    statsRec["局収支"] = String(Number(statsRec["局収支"]) + Number(statsRec["積み棒"]));
                  statsRec["持ち点"] = String(nowPoints[m.no] + Number(statsRec["局収支"]));
                  nowPoints[m.no] = Number(statsRec["持ち点"]);
                } else if (pMap.length == 4) {
                  // ツモ
                  if (Number(currentP.income) > 1) {
                    statsRec["結果"] = "自摸和了り";
                    statsRec["打点"] = currentP.income;
                    statsRec["供託"] = Number(kyoutaku) ? String(Number(kyoutaku) * 1000) : "";
                    statsRec["積み棒"] = tumi ? String(Number(tumi) * 3) : "";
                    statsRec["和了"] = "和了";
                    statsRec["役"] = yaku.join("、").trim();
                    statsRec["立直"] = yaku.indexOf("リーチ") > -1 || yaku.indexOf("立直") > -1 ? "立直" : "NO";
                  } else
                    (statsRec["結果"] = "自摸られ"),
                      (statsRec["積み棒"] = tumi ? `-${tumi}` : ""),
                      (statsRec["立直"] = "NO");
                  statsRec["和了点"] = currentP.income;
                  statsRec["局収支"] = currentP.income;
                  if (statsRec["供託"])
                    statsRec["局収支"] = String(Number(statsRec["局収支"]) + Number(statsRec["供託"]));
                  if (statsRec["積み棒"])
                    statsRec["局収支"] = String(Number(statsRec["局収支"]) + Number(statsRec["積み棒"]));
                  statsRec["持ち点"] = String(nowPoints[m.no] + Number(statsRec["局収支"]));
                  nowPoints[m.no] = Number(statsRec["持ち点"]);
                }

                statsRecs.push(statsRec);
              });
            }
          }
        }
        let resultRecs = []; // 結果
        let lastStats = statsRecs.filter((s, i) => i > statsRecs.length - 5);
        results.forEach((r) => {
          let p = "",
            uma = 0;
          switch (r.order) {
            case "1":
              uma = 50000;
              break;
            case "2":
              uma = 10000;
              break;
            case "3":
              uma = -10000;
              break;
            case "4":
              uma = -30000;
              break;
          }
          p = (r.ten - 30000 + uma) / 1000;
          resultRecs.push({
            試合No: urlMap,
            日にち: getHiniti(urlMap),
            シーズン: getSeason(urlMap.substr(4, 4)),
            TeamID: r.teamId,
            登板選手: r.no,
            選手名: member.filter((m) => m.no === r.no)[0].full,
            ポイント: p,
            保有点: r.ten,
            着順: r.order,
          });
          let lastP = lastStats.filter((l) => l["選手No"] == r.no)[0];
          if (lastP["持ち点"] != r.ten)
            this.logger.info(
              `wrong Point!! ${resultRecs[resultRecs.length - 1]["選手名"]}stats:[${lastP["持ち点"]}] res:[${r.ten}]`
            );
        });
        this.logger.debug(statsRecs, resultRecs);
        // DBに保存
        await this.updateLutl("stats", statsRecs);
        await this.updateLutl("resutls", resultRecs);
      }
    } catch (e) {
      this.logger.info(e);
    }
    return this.driver;
  }

  // 取得結果をDBに書き込み
  async updateLutl(col, doc) {
    let rec = await db(col, "insertMany", {}, doc);
    this.logger.info("insertMany!!!");
  }
}
// 日程(YYYYMMDD)からgameIdを返す(2つあり)
async function getUrlMapFromGameId(db, dateStr) {
  let seasonRec = await db.select("SEASON", `year = ${db.year}`);
  if (!seasonRec.length) throw `${db.year}シーズンのURL情報が見つかりません。`;
  seasonRec.sort((a, b) => {
    return a.start_date < b.start_date ? -1 : 1; //オブジェクトの昇順ソート
  }); // 破壊的
  let targetSeason = "";
  for (let rec of seasonRec) {
    // 後が優先（R<S<F）
    if (rec.start_date <= dateStr) targetSeason = rec;
  }
  if (targetSeason.start_date) `${db.year}シーズンのURL情報が見つかりません。(開始日)`;

  let scheRec = await db.select("SCHE", `date >= ${targetSeason.start_date}`);
  if (!scheRec.length) throw `${targetSeason.start_date}以降のスケジュールが見つかりません`;
  let order = ""; // これがscheで抽出したレコードの順番に対応するはず→gameIDの要素
  for (let i in scheRec) {
    if (rec[i].date == dateStr) {
      order = i + 1;
      break;
    }
  }
  if (order) throw `対応するスケジュールが見つかりません（ない）`;
  // https://viewer.ml-log.jp/web/viewer?gameid=L001_S013_0085_02A
  let gameIdCommon = `${targetSeason.url_key}_${order.toString().padStart(4, "0")}_`;
  return [`${gameIdCommon}01A`, `${gameIdCommon}02A`];
}
// TODO SEASONの情報は、GUI側から登録するように
// gameIdから日程(YYYYMMDD)を返す
async function getUrlMapFromDate(db, urls) {
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
  // let tmpArr = gameId.split("_");
  // let seasonKey = `${tmpArr[0]}_${tmpArr[1]}`; // url_key
  // let order = tmpArr[2]; // これがscheで抽出したレコードの順番に対応するはず

  // let seasonRec = await db.select("SEASON", `year = ${db.year} and url_key = ${seasonKey} `);
  // if (!seasonRec.length) throw `${db.year}シーズンのURL情報が見つかりません。`;

  // let scheRec = await db.select("SCHE", `date >= ${seasonRec.start_date}`);
  // if (!scheRec.length) throw `${seasonRec.start_date}以降のスケジュールが見つかりません`;
  // if (scheRec.length < order + 1) throw `対応するスケジュールが見つかりません（範囲外）`;
  // return scheRec[order + 1].date;
}
if (process.argv.length > 2) {
  start(process.argv);
} else logger.warn("引数が足りません");
