const logger = require("./initter.js").log();
global.log = logger;
logger.debug(process.argv);
const conf = require("config");
const fs = require("fs");
const { D } = require("./lib/defain.js");
const sqliteDb = require("./sql").sqliteDb;

async function start(p) {
  try {
    // TODO 引数にどのデータを解析するか 2:year 3:日にち
    let db = new sqliteDb(p[2]);
    let dateList = [];
    if (p[3]) {
      // dateList = p[3].split(",");
      dateList = [
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
        "20230321",
      ]; // TODO いまだけ
    } else {
      // SCHE　から日付を引いて、それを日付ごとにループする
    }
    let yakuRecs = await db.select("YAKU");
    let yakuMap = yakuRecs.reduce((p, c) => {
      if (c.official) p[c.official] = c.haruzo;
      return p;
    }, {});
    // シーズン判別で、seasonも引いとく
    let seasonRecs = await db.select("SEASON", `year = "${db.year}"`);
    seasonRecs.sort((a, b) => {
      return a.start_date < b.start_date ? -1 : 1; //オブジェクトの昇順ソート
    }); // 破壊的
    if (!dateList.length) throw "変換対象の日付が不明です";
    for (let date of dateList) {
      let targetCmd = [
        "'player'",
        "'gamestart'",
        "'kyokustart'",
        "'point'",
        "'say'",
        "'richi'",
        "'open'",
        "'agari'",
        "'kyokuend'",
        "'ryukyoku'",
        "'gameend'",
      ];
      for (let gameNo of [1, 2]) {
        let recs = await db.select(
          "RAW",
          `date_id = "${date}" and cmd in(${targetCmd}) and game_id like "%${gameNo}A"`
        );
        if (!recs.length) throw `${date}の変換元のデータが見つかりません`;
        // logger.debug(recs);
        let players = {},
          stats = [],
          result = [],
          kyokuStats = [],
          gameCommon = {},
          nanichaMap = {},
          currentPoint = {},
          kanFlag = false,
          currentKyoku = { tenpaiPlayer: [], tsumoFlag: false, ryuukyokuFlag: false, tumi: 0, kyoutaku: 0 };
        // シーズン算出
        for (let rec of seasonRecs) {
          if (rec.start_date <= date) gameCommon.season = `${db.year}${rec.kind}`;
        }
        for (let rec of recs) {
          let args = JSON.parse(rec.args);
          switch (rec.cmd) {
            case "player":
              // L001_S013_0001_01A|["A0","萩原 聖人","user","T006"]
              // L001_S013_0001_01A|["B0","魚谷 侑未","user","T005"]
              // L001_S013_0001_01A|["C0","佐々木 寿人","user","T003"]
              // L001_S013_0001_01A|["D0","鈴木 優","user","T007"]
              players[args[0]] = D.MEMBER_LIST.filter((m) => m.full == args[1])[0];
              break;
            case "gamestart":
              if (Object.keys(players).length != 4) throw "playerが４人いません";
              let no = rec.game_id.substr(rec.game_id.lastIndexOf("_") + 2, 1);
              gameCommon.game_id = rec.game_id;
              gameCommon.game_no = `${rec.date_id}-${no}`;
              gameCommon.date = getHiniti(rec.date_id);
              currentPoint = {};
              nanichaMap = {};
              let pList = Object.keys(players);
              for (let i in pList) {
                nanichaMap[pList[i]] = i; // kyokuStatsの添字をマッピング
                currentPoint[pList[i]] = 25000; // 最初の持ち点
              }
              break;
            case "kyokustart":
              kyokuStats = [];
              currentKyoku = { tenpaiPlayer: [], tsumoFlag: false, ryuukyokuFlag: false, tumi: 0, kyoutaku: 0 };
              // L001_S013_0001_01A|["0","D0","1","1000","1z","2z","3z","4z","1z"]
              let kyoku = D.KYOKU_LIST.filter(
                (k) => k.no == `${args[4] == "1z" ? "t" : "n"}-${D.KYOKU_NO_MAP[args[1]]}-${args[2]}`
              )[0];
              currentKyoku.tumi = Number(args[2]);
              currentKyoku.kyoutaku = args[2] != "0" ? Number(args[3]) : 0;
              let tmpStatus = Object.keys(D.STATUS_KEY_MAP).reduce((a, b) => {
                a[b] = "";
                return a;
              }, {});
              for (let [key, player] of Object.entries(players)) {
                let kyokuRec = {
                  ...tmpStatus,
                  nanicha: key, // 保存しない、このループでの紐付け情報
                  game_id: gameCommon.game_id,
                  game_no: gameCommon.game_no,
                  date: gameCommon.date,
                  p_id: player.no,
                  team_id: player.teamId,
                  p_name: player.full,
                  kyoku_no: kyoku.no,
                  kyoku: kyoku.name,
                  reach: "NO",
                  point_get: 0,
                };
                kyokuStats.push(kyokuRec);
              }
              break;
            case "point":
              if (args[1].indexOf("=") === -1 && !currentKyoku.ryuukyokuFlag) {
                // ここで正しい収入、打点、がわかる
                // { "time": "2023-02-27 21:15:54", "id": "302084", "cmd": "point", "args": ["A0", "-1200"] },
                // { "time": "2023-02-27 21:15:54", "id": "302085", "cmd": "point", "args": ["B0", "-1200"] },
                // { "time": "2023-02-27 21:15:54", "id": "302086", "cmd": "point", "args": ["C0", "-1200"] },
                // { "time": "2023-02-27 21:15:54", "id": "302087", "cmd": "point", "args": ["D0", "+3600"] },
                let tmp = kyokuStats[nanichaMap[args[0]]];
                let p = Number(args[1]);
                let tmpKyoutaku = tmp.kyoutaku ? tmp.kyoutaku : 0;
                if (p != tmpKyoutaku) {
                  if (args[1].indexOf("+") === 0) {
                    let tumiP = currentKyoku.tumi * 300;
                    currentKyoku.kyoutaku += tmpKyoutaku; // あがった人がリーチしてたらその分引く
                    tmp = {
                      ...tmp,
                      balance: p,
                      point_get: p - currentKyoku.kyoutaku - tumiP,
                      point_get2: p - currentKyoku.kyoutaku - tumiP,
                      kyoku_res: currentKyoku.tsumoFlag ? "自摸和了り" : "出和了り",
                      kyoutaku: currentKyoku.kyoutaku ? currentKyoku.kyoutaku : "",
                      tumi: tumiP ? tumiP : "",
                      agari: "和了",
                    };
                  } else {
                    let tumiP = currentKyoku.tumi * (currentKyoku.tsumoFlag ? 100 : 300);
                    tmp = {
                      ...tmp,
                      balance: p,
                      point_get: p - tmpKyoutaku + tumiP,
                      kyoku_res: currentKyoku.tsumoFlag ? "自摸られ" : "放銃",
                      tumi: tumiP ? -tumiP : "",
                    };
                  }
                  currentPoint[args[0]] += p;
                  tmp.point_now = currentPoint[args[0]];
                  kyokuStats[nanichaMap[args[0]]] = tmp;
                }
              }
              break;
            case "say":
              // furo: "副露",
              if (["chi", "pon", "kan"].indexOf(args[1]) > -1) {
                if (args[1] === "kan") kanFlag = true;
                kyokuStats[nanichaMap[args[0]]].furo
                  ? kyokuStats[nanichaMap[args[0]]].furo++
                  : (kyokuStats[nanichaMap[args[0]]].furo = 1);
              } else if (["tsumo"].indexOf(args[1]) > -1) currentKyoku.tsumoFlag = true;
              else if (["tenpai"].indexOf(args[1]) > -1) currentKyoku.tenpaiPlayer.push(args[0]);
              break;
            case "richi":
              // reach: "立直",
              kyokuStats[nanichaMap[args[0]]].reach = "立直";
              kyokuStats[nanichaMap[args[0]]].kyoutaku = -1000;
              currentKyoku.kyoutaku += 1000;
              break;
            case "open":
              // かかん、暗槓は副露に含めず
              // L001_S013_0078_02A|20230221|2023-02-21 20:57:28|202129|open|["D0","(1p1p1p1p)"// 含めない
              // L001_S013_0001_02A|20221003|2022-10-03 21:18:45|1100049|open|["B0","[5z5z5z]","5z"] // かかん！　含めない（すでにponしてるから）
              // L001_S013_0074_01A|20230214|2023-02-14 19:33:50|1300078|open|["C0","<1m1m1m>","1m"]  // 大民間
              if (kanFlag) {
                if (args[1].indexOf("(") > -1 || args[1].indexOf("[") > -1) {
                  kyokuStats[nanichaMap[args[0]]].furo =
                    kyokuStats[nanichaMap[args[0]]].furo === 1 ? "" : kyokuStats[nanichaMap[args[0]]].furo - 1;
                }
              }
              kanFlag = false;
              break;
            case "agari":
              // yaku: "役",
              if (args[0].indexOf("ron=") === 0) args.splice(0, 1); // 不要なので削除
              let tmp = kyokuStats[nanichaMap[args[0]]];
              args.splice(0, 3); // 不要なので削除
              for (let i in args) {
                if (i % 2 === 1) continue; // 奇数番目はスキップ　偶数番目に役名あり
                if (!tmp.yaku) tmp.yaku = [];
                let yaku = args[i];
                if (["裏ドラ", "ドラ", "赤"].indexOf(yaku) > -1) yaku += args[Number(i) + 1];
                tmp.yaku.push(yaku);
              }
              // tmp.yaku = tmp.yaku.join(",");  // 後でやるほうがいいか。
              break;
            case "ryukyoku":
              // point_tenpai: "聴牌料",
              // balance: "局収支",
              // point_now: "持ち点",
              // kyoku_res: tsumoFlag ? "自摸和了り" : "流局不聴",
              let plusNum = currentKyoku.tenpaiPlayer.length % 4;
              let tenpaiP = plusNum ? 3000 / plusNum : 0;
              let notenP = plusNum ? -3000 / (4 - plusNum) : 0;
              for (let [key, index] of Object.entries(nanichaMap)) {
                let tenpaiStats = {};
                let iKyoutaku = kyokuStats[index].kyoutaku ? kyokuStats[index].kyoutaku : 0;
                if (currentKyoku.tenpaiPlayer.indexOf(key) > -1)
                  tenpaiStats = {
                    point_tenpai: tenpaiP,
                    kyoku_res: "流局聴牌",
                    balance: tenpaiP + iKyoutaku,
                  };
                else
                  tenpaiStats = {
                    point_tenpai: notenP,
                    kyoku_res: "流局不聴",
                    balance: notenP + iKyoutaku,
                  };
                currentPoint[key] += tenpaiStats.balance;
                kyokuStats[index] = {
                  ...kyokuStats[index],
                  ...tenpaiStats,
                  point_now: currentPoint[key],
                };
              }
              currentKyoku.ryuukyokuFlag = true;
              break;
            case "kyokuend":
              if (!currentKyoku.ryuukyokuFlag) {
                // 流局しないとき
                if (!currentKyoku.tsumoFlag) {
                  // ロン上がりのとき、横移動の情報を追加
                  for (let line of kyokuStats) {
                    if (line.kyoku_res) continue;
                    line.point_now = currentPoint[line.nanicha];
                    line.kyoku_res = "横移動";
                    let p = line.kyoutaku ? line.kyoutaku : 0;
                    line.balance = p;
                    currentPoint[line.nanicha] += p;
                    line.point_now = currentPoint[line.nanicha];
                  }
                }
                // 役情報を変換し、フラットに
                for (let line of kyokuStats) {
                  if (!line.yaku) continue;
                  let haruzoYaku = [];
                  for (let y of line.yaku) {
                    let hY = y;
                    if (y in yakuMap) {
                      hY = yakuMap[y];
                    } else await db.insert("YAKU", [[y, ""]]); // 見つからなかったら追加だけする
                    if (
                      line.furo &&
                      ["全帯么", "三色同順", "一気通貫", "混一色", "純全帯么", "清一色"].indexOf(hY) > -1
                    )
                      hY += "（鳴）"; // 鳴いてたら
                    haruzoYaku.push(hY);
                  }
                  line.yaku = haruzoYaku.join("、");
                }
              }
              stats = stats.concat(kyokuStats);
              break;
            case "gameend":
              // L001_S013_0001_02A|["D0","78.8","A0","14.9","C0","-35.8","B0","-57.9","D0_rank=0","A0_rank=1","C0_rank=2","B0_rank=3"]
              let rankMap = {};
              let rankMapP = {};
              for (let i = args.length - 4; i < args.length; i++) {
                // 同じランクがあったら、馬は半分こにするために確認
                let r = Number(args[i].substr(args[i].length - 1, 1)) + 1;
                if (!(r in rankMap)) rankMap[r] = [];
                rankMap[r].push(args[i].substr(0, 2)); // ランクに対して、人をぶら下げる
                rankMapP[args[i].substr(0, 2)] = r;
              }
              let juniMapTmp = { 1: 20000, 2: -20000, 3: -40000, 4: -60000 };
              let juniMap = {};
              // +20000              32500:52.500
              // -20000              25000:5000
              // -40000              22500:-17.500
              // -60000              20000:-40000
              for (let i = 1; i < 5; i++) {
                let r = Object.values(rankMap).filter((r) => i === r);
                if (r.length === 1) {
                  juniMap[i] = juniMapTmp[i];
                } else if (r.length === 2) {
                  juniMap[i] = (juniMapTmp[i] + juniMapTmp[i + 1]) / 2;
                } else if (r.length === 3) {
                }
              }
              let getJuniP = (pl) => {
                switch (rankMap[rankMapP[pl]].length) {
                  case 1:
                    return juniMapTmp[rankMapP[pl]];
                  case 2:
                    return (juniMapTmp[rankMapP[pl]] + juniMapTmp[rankMapP[pl] + 1]) / 2;
                  case 3:
                    let pri = rankMap[rankMapP[pl]].filter((a) => a < pl)[0]; // 起家かチェック
                    if (!pri) {
                      // 1位が３人のとき
                      // -13400
                      // -13400
                      // -13200 // 起家に近い人
                      // 16.8 16.6 16.6
                      // 2位が３人のとき
                      // -40000 -10
                      return rankMapP[pl] === 1 ? -13200 : -40000;
                    } else {
                      return rankMapP[pl] === 1 ? -13400 : -40000;
                    }
                }
              };

              let checkTotal = 0;
              for (let i = 0; i < 8; i += 2) {
                let rank = rankMapP[args[i]];
                let p = Number(args[i + 1]);
                let tenbo = Math.round(p * 1000 - getJuniP(args[i]));
                // 2ずつ処理
                result.push({
                  game_id: gameCommon.game_id,
                  game_no: gameCommon.game_no,
                  date: gameCommon.date,
                  season: gameCommon.season,
                  team_id: players[args[i]].teamId,
                  p_id: players[args[i]].no,
                  p_name: players[args[i]].full,
                  point: p,
                  // tenbo: kyokuStats[nanichaMap[args[i]]].point_now,
                  tenbo: tenbo,
                  rank: rank,
                });
                checkTotal += tenbo;
                if (kyokuStats[nanichaMap[args[i]]].point_now != tenbo) {
                  kyokuStats[nanichaMap[args[i]]].kyoutaku = tenbo - kyokuStats[nanichaMap[args[i]]].point_now;
                  kyokuStats[nanichaMap[args[i]]].balance += kyokuStats[nanichaMap[args[i]]].kyoutaku;
                  kyokuStats[nanichaMap[args[i]]].point_now = tenbo;
                }
              }
              if (checkTotal !== 100000) {
                for (let r of result) {
                  r.point = `結果が正しくありません。${r.point} `;
                }
              } else {
                stats.splice(stats.length - 4, 4);
                stats = stats.concat(kyokuStats); // 持ち点の更新を反映
              }
              break;
          }
          // console.log(result);
        }
        logger.info(stats);
        logger.info(result);
        let saveRec = [];
        stats.forEach((r) => {
          delete r.nanicha;
          saveRec.push([...Object.values(r)]);
        });
        await db.insert("STATUS", saveRec);
        saveRec = [];
        result.forEach((r) => {
          saveRec.push([...Object.values(r)]);
        });
        await db.insert("RESULTS", saveRec);
      }
    }
  } catch (e) {
    logger.warn(e);
  }
}
let getHiniti = (b) => {
  return `${b.substr(0, 4)}/${Number(b.substr(4, 2)).toString()}/${Number(b.substr(6, 2)).toString()}`;
};
if (process.argv.length > 2) {
  start(process.argv);
} else logger.warn("引数が足りません");
