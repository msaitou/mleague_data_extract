const sqlite3 = require("sqlite3").verbose();
const conf = require("config");
const db = new sqlite3.Database(conf.db);
const fs = require("fs");
const { D } = require("./lib/defain");
class sqliteDb {
  TB = {
    NAME: {
      ACCOUNT: "account",
      SCHE: "schedule",
      STATUS: "status",
      RESULTS: "results",
      RAW: "raw",
      SEASON: "season",
      YAKU: "yaku",
      TMP: "tmp",
    },
    ACCOUNT: { FIELD: { id: "id text primary key", password: "password" } },
    SCHE: { FIELD: { date: "date text primary key", order_no: "order_no" } },
    SEASON: { FIELD: { year: "year", url_key: "url_key", kind: "kind", start_date: "start_date" } },
    RAW: { FIELD: { game_id: "game_id", date_id: "date_id", time: "time", id: "id", cmd: "cmd", args: "args" } },
    YAKU: { FIELD: { official: "official", haruzo: "haruzo" } },
    TMP: { FIELD: { date: "date" } },
    STATUS: {
      FIELD: Object.keys(D.STATUS_KEY_MAP).reduce((p, c) => {
        p[c] = c;
        return p;
      }, {}),
    },
    RESULTS: {
      FIELD: Object.keys(D.RESULTS_KEY_MAP).reduce((p, c) => {
        p[c] = c;
        return p;
      }, {}),
    },
  };
  logger;
  year;
  constructor() {
    this.logger = global.log;
  }
  setYear(year) {
    this.year = year; // table名に必要
  }
  // データの更新(複数OK)
  insert(tblKey, recs) {
    if (recs && recs.length > 0) {
      // 1レコード分のplaceholderを配列の数だけ用意
      let hatena = recs[0].map(() => "?").join(", ");
      let placeholders = recs.map(() => `(${hatena})`).join(", ");
      // 値を格納する1次元配列
      let flatArray = [];
      // 2次元配列を1次元配列に変換する
      recs.forEach((arr) => {
        arr.forEach((item) => {
          flatArray.push(item);
        });
      });
      return new Promise((resolve, reject) => {
        db.serialize(() => {
          db.run(
            `insert into ${this.getTblName(tblKey)}(${Object.keys(this.TB[tblKey].FIELD)}) values ${placeholders} `,
            flatArray,
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      });
    }
  }
  // 更新（１件のみ）
  update(tblKey, rec, cond) {
    if (Object.keys(rec) && Object.keys(rec).length > 0 && cond) {
      let setList = [];
      for (let [key, val] of Object.entries(rec)) {
        setList.push(`${key} = "${val}"`);
      }
      return new Promise((resolve, reject) => {
        db.serialize(() => {
          db.run(`update ${this.getTblName(tblKey)} set ${setList.join(", ")} where ${cond} `, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });
    }
  }
  // sqlite3を同期的に返す　select用
  select(tblKey, cond, fields) {
    let whereStr = "",
      fieldStr = "*";
    if (cond) whereStr = `where ${cond}`;
    if (fields) fieldStr = fields;
    return new Promise((resolve, reject) => {
      db.all(`select ${fieldStr} from ${this.getTblName(tblKey)} ${whereStr}`, [], (err, rows) => {
        if (err) {
          reject(err, rows);
          return;
        }
        resolve(rows);
      });
    });
  }
  // sqlite3を同期的に返す　delete用
  delete(tblKey, cond) {
    let whereStr = "";
    if (cond) whereStr = `where ${cond}`;
    return new Promise((resolve, reject) => {
      db.all(`delete from ${this.getTblName(tblKey)} ${whereStr}`, [], (err, rows) => {
        if (err) {
          reject(err, rows);
          return;
        }
        resolve(rows);
      });
    });
  }
  // 個別のやつ
  extracted() {
    // select distinct date_id,raw_2022.game_id,results_2022.game_no from raw_2022 left outer join results_2022 on raw_2022.game_id=results_2022.game_id where raw_2022.id="1";
    return new Promise((resolve, reject) => {
      db.all(
        `select distinct date_id,${this.getTblName("RAW")}.game_id,${this.getTblName(
          "RESULTS"
        )}.game_no from ${this.getTblName("RAW")} left outer join ${this.getTblName("RESULTS")} on ${this.getTblName(
          "RAW"
        )}.game_id = ${this.getTblName("RESULTS")}.game_id where ${this.getTblName("RAW")}.id="1";`,
        [],
        (err, rows) => {
          if (err) {
            reject(err, rows);
            return;
          }
          resolve(rows);
        }
      );
    });
  }
  getTblName(name) {
    if (["ACCOUNT", "SEASON", "YAKU", "TMP"].indexOf(name) > -1) return this.TB.NAME[name];
    else return `${this.TB.NAME[name]}_${this.year}`; //年ごとにTBL
  }
  // tableを新規作成
  init() {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        let sqlList = [
          `create table if not exists ${this.getTblName("ACCOUNT")}(${Object.values(this.TB.ACCOUNT.FIELD)});`,
          `create table if not exists ${this.getTblName("RAW")}(${Object.values(this.TB.RAW.FIELD)});`,
          `create table if not exists ${this.getTblName("SCHE")}(${Object.values(this.TB.SCHE.FIELD)});`,
          `create table if not exists ${this.getTblName("STATUS")}(${Object.values(this.TB.STATUS.FIELD)});`,
          `create table if not exists ${this.getTblName("RESULTS")}(${Object.values(this.TB.RESULTS.FIELD)});`,
          `create table if not exists ${this.getTblName("SEASON")}(${Object.values(this.TB.SEASON.FIELD)});`,
          `create table if not exists ${this.getTblName("YAKU")}(${Object.values(this.TB.YAKU.FIELD)});`,
          `create table if not exists ${this.getTblName("TMP")}(${Object.values(this.TB.TMP.FIELD)});`,
        ];
        try {
          sqlList.forEach((sql, i) => {
            this.logger.info(sql);
            db.run(sql, [], () => {
              if (i === sqlList.length - 1) resolve(); // 同期的にするため
            });
          });
        } catch (e) {
          reject(e);
        }
      });
    });
  }
}
exports.sqliteDb = sqliteDb;
function myValues(obj) {
  return Object.keys(obj).map((k) => {
    if (k != "check") return `"${obj[k]}"`;
    else return obj[k];
  });
}
async function main() {
  let dbc = new sqliteDb();
  let year = "2022";
  db.serialize(() => {
    // アカウント
    let sqlList = [
      `create table if not exists ${dbc.TB.NAME.ACCOUNT}(${Object.values(dbc.TB.ACCOUNT.FIELD)});`,
      `create table if not exists ${dbc.TB.NAME.RAW}_${year}(${Object.values(dbc.TB.RAW.FIELD)});`,
      `create table if not exists ${dbc.TB.NAME.SCHE}_${year}(${Object.values(dbc.TB.SCHE.FIELD)});`,
      `create table if not exists ${dbc.TB.NAME.STATUS}_${year}(${Object.values(dbc.TB.STATUS.FIELD)});`,
      `create table if not exists ${dbc.TB.NAME.RESULTS}_${year}(${Object.values(dbc.TB.RESULTS.FIELD)});`,
    ];
    Object.values(dbc.TB.NAME).forEach((name) => {
      if (name != dbc.TB.NAME.ACCOUNT) db.run(`drop table if exists ${name}_${year};`);
    });
    sqlList.forEach((sql) => {
      console.log(sql);
      db.run(sql);
    });

    // console.log(`insert into aca(${dbc.TB.ACCOUNT.FIELD}) values(${myValues(preSetting.account)});`);
    // db.run(`insert into aca(${dbc.TB.ACCOUNT.FIELD}) values(${myValues(preSetting.account)});`);
  });
}
const MODE = "migrate";
// console.log(process.argv);
if (process.argv[1].indexOf("sql.js") > -1) {
  if (process.argv[2] && MODE == process.argv[2]) {
    main();
    // process.exit();
  } else {
    console.log(`引数は、${MODE} だけです！`);
  }
}
// db.close();
