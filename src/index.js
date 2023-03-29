const ID1 = "#t1"; // データ抽出タブ
const ID3 = "#t3"; // 整形＆出力タブ
const ID4 = "#t4"; // シーズン
const ID5 = "#t5"; // 役
const ID6 = "#t6"; // プレイヤー
// データ抽出タブ ID1------------------------------
let id1FieldsList = ["game_no", "status"];
let getId1data = async () => {
  let year = document.querySelector(`${ID1} input[name="year"]`).value;
  if (!year) {
    let msg = document.querySelector(`${ID1} span[name="year"]`);
    msg.classList.toggle("dnone");
    setTimeout(() => {
      msg.classList.toggle("dnone");
    }, 2000);
    return;
  }
  let data = await window.eAPI.extractedData(year);
  let html = "";
  console.log(data);
  data.forEach((d) => {
    html += `<tr>`;
    html += `<td><input type="checkbox" class="form-checkbox" name="check" game_id="${d.game_id}"/></td>`;
    html += id1FieldsList.reduce((l, f) => l + `<td ${f}>${d[f]}</td>`, ``);
    html += `</tr>`;
  });
  // console.log(html);
};
document.querySelector(`${ID1} button.extract`).addEventListener("click", async () => {
  let data = {
    year: document.querySelector(`${ID1} [name="year"]`).value,
    reconvert: document.querySelector(`${ID1} #reconvert`).checked,
    targetList: {},
  };
  document.querySelectorAll(`${ID1} [name='check']`).forEach((el, i) => {
    if (el.checked) {
      // if (!data.reconvert && el.closest("tr").querySelector("[status]").textContent == "済") return;
      let gameNo = el.closest("tr").querySelector("[game_no]").textContent;
      let dateId = gameNo.substring(0, gameNo.length - 2);
      if (!(dateId in data.targetList)) data.targetList[dateId] = [];
      data.targetList[dateId].push(el.getAttribute("game_id"));
    }
  });
  console.log(data);
  let res = await window.eAPI.convert(data);
  console.log(res);
  for (let [tbl, lines] of Object.entries(res)) {
    if (["STATUS","RESULTS"].indexOf(tbl) === -1) continue;
    //IEとその他で処理の切り分け
    if (navigator.appVersion.toString().indexOf(".NET") > 0) {
      //IE 10+
      window.navigator.msSaveBlob(res, fileName + ".pdf");
    } else {
      //aタグの生成
      var a = document.createElement("a");
      //レスポンスからBlobオブジェクト＆URLの生成
      var blobUrl = window.URL.createObjectURL(new Blob([lines], { type: "text/csv" }));
      //上で生成したaタグをアペンド
      document.body.appendChild(a);
      a.style = "display: none";
      //BlobオブジェクトURLをセット
      a.href = blobUrl;
      //ダウンロードさせるファイル名の生成
      a.download = tbl + ".csv";
      //クリックイベント発火
      a.click();
    }
  }

  getId1data(); // 再表示
});
// データ抽出タブ ID1------------------------------
// 整形＆出力タブ ID3------------------------------
let id3FieldsList = ["game_no", "status"];
let getId3data = async () => {
  let year = document.querySelector(`${ID3} input[name="year"]`).value;
  if (!year) {
    let msg = document.querySelector(`${ID3} span[name="year"]`);
    msg.classList.toggle("dnone");
    setTimeout(() => {
      msg.classList.toggle("dnone");
    }, 2000);
    return;
  }
  let data = await window.eAPI.extractedData(year);
  let html = "";
  console.log(data);
  data.forEach((d) => {
    html += `<tr>`;
    html += `<td><input type="checkbox" class="form-checkbox" name="check" game_id="${d.game_id}"/></td>`;
    html += id1FieldsList.reduce((l, f) => l + `<td ${f}>${d[f]}</td>`, ``);
    html += `</tr>`;
  });
  // console.log(html);
  document.querySelector(`${ID3} span.recnum`).textContent = data.length;
  document.querySelector(`${ID3} span.convertnum`).textContent = data.filter((d) => d.status == "済").length;
  document.querySelector(`${ID3} div[summary]`).classList.remove("d-none"); // 表示する
  document.querySelector(`${ID3} tbody`).innerHTML = html;
  document.querySelectorAll(`${ID3} table td`).forEach((el) => {
    el.addEventListener("click", (e) => {
      let checkEl = e.target.parentElement.querySelector("[name='check']");
      checkEl.checked = !checkEl.checked;
    });
  }); // 行クリックでチェックonoff
};
document.querySelector(`${ID3} button.redisp`).addEventListener("click", getId3data);
document.querySelector(`${ID3} #checkall`).addEventListener("change", (e) => {
  console.log(e.target.checked);
  document.querySelectorAll(`${ID3} [name="check"]`).forEach((el) => {
    el.checked = e.target.checked;
  });
});
document.querySelector(`${ID3} button.output`).addEventListener("click", async () => {
  let data = {
    year: document.querySelector(`${ID3} [name="year"]`).value,
    reconvert: document.querySelector(`${ID3} #reconvert`).checked,
    targetList: {},
  };
  document.querySelectorAll(`${ID3} [name='check']`).forEach((el, i) => {
    if (el.checked) {
      // if (!data.reconvert && el.closest("tr").querySelector("[status]").textContent == "済") return;
      let gameNo = el.closest("tr").querySelector("[game_no]").textContent;
      let dateId = gameNo.substring(0, gameNo.length - 2);
      if (!(dateId in data.targetList)) data.targetList[dateId] = [];
      data.targetList[dateId].push(el.getAttribute("game_id"));
    }
  });
  console.log(data);
  let res = await window.eAPI.convert(data);
  console.log(res);
  for (let [tbl, lines] of Object.entries(res)) {
    if (["STATUS","RESULTS"].indexOf(tbl) === -1) continue;
    //IEとその他で処理の切り分け
    if (navigator.appVersion.toString().indexOf(".NET") > 0) {
      //IE 10+
      window.navigator.msSaveBlob(res, fileName + ".pdf");
    } else {
      //aタグの生成
      var a = document.createElement("a");
      //レスポンスからBlobオブジェクト＆URLの生成
      var blobUrl = window.URL.createObjectURL(new Blob([lines], { type: "text/csv" }));
      //上で生成したaタグをアペンド
      document.body.appendChild(a);
      a.style = "display: none";
      //BlobオブジェクトURLをセット
      a.href = blobUrl;
      //ダウンロードさせるファイル名の生成
      a.download = tbl + ".csv";
      //クリックイベント発火
      a.click();
    }
  }

  getId3data(); // 再表示
});
// 整形＆出力タブ ID3------------------------------
// シーズンタブ ID4------------------------------
let id4FieldsList = ["year", "url_key", "kind", "start_date"];
let getId4data = async () => {
  let data = await window.eAPI.accessDb("SEASON", "select", null, {
    cond: null,
    fields: `OID,${id4FieldsList.join(",")}`,
  });
  let html = "";
  // console.log(data);
  data.forEach((d) => {
    html += `<tr>`;
    // `<td>${d.year}</td><td>${d.url_key}</td><td>${d.kind}</td><td>${d.start_date}</td>`;
    html += id4FieldsList.reduce((l, f) => l + `<td>${d[f]}</td>`, ``);
    html += `<td><i class="btn btn-sm btn-dark me-1 py-0 fas fa-edit" rowid="${d.rowid}"></i>
    <i class="btn btn-sm btn-dark me-1 py-0 fas fa-trash-can" rowid="${d.rowid}"></i></td></tr>`;
  });
  console.log(html);
  document.querySelector(`${ID4} tbody`).innerHTML = html;
  document.querySelectorAll(`${ID4} i.fa-edit`).forEach((e, i) => {
    e.addEventListener("click", () => {
      let d = data.filter((d) => d.rowid == e.getAttribute("rowid"))[0];
      document.querySelector(`${ID4} input[name='rowid']`).value = d.rowid;
      id4FieldsList.forEach((f) => {
        document.querySelector(`${ID4} input[name='${f}']`).value = d[f];
      });
      document.querySelector(`${ID4} .mode`).textContent = "編集";
      document.querySelector(`${ID4} .mode`).classList.add("text-warning");
    });
  });
  document.querySelectorAll(`${ID4} i.fa-trash-can`).forEach((e, i) => {
    e.addEventListener("click", async () => {
      console.log("trash");
      let rowid = e.getAttribute("rowid");
      if (rowid) {
        where = `rowid = ${rowid}`;
        let data = await window.eAPI.accessDb("SEASON", "delete", null, { cond: where });
        console.log(data);
        getId4data(); // 再表示
      }
    });
  });
};
document.querySelector(`${ID4} button.redisp`).addEventListener("click", getId4data);
document.querySelector(`${ID4} a.new`).addEventListener("click", () => {
  document.querySelector(`${ID4} input[name='rowid']`).value;
  id4FieldsList.forEach((f) => {
    document.querySelector(`${ID4} input[name='${f}']`).value = "";
  });
  document.querySelector(`${ID4} .mode`).textContent = "新規";
  document.querySelector(`${ID4} .mode`).classList.remove("text-warning");
});
document.querySelector(`${ID4} button.save`).addEventListener("click", async () => {
  let saveData = [[]];
  id4FieldsList.forEach((f) => {
    saveData[0].push(document.querySelector(`${ID4} input[name='${f}']`).value);
  });
  let where = "";
  let method = "insert";
  let rowid = document.querySelector(`${ID4} input[name='rowid']`).value;
  if (rowid) {
    method = "update";
    where = `rowid = ${rowid}`;
    let tmp = {};
    id4FieldsList.forEach((f, i) => {
      tmp[f] = saveData[0][i];
    });
    saveData = tmp;
  }
  let data = await window.eAPI.accessDb("SEASON", method, null, { recs: saveData, cond: where });
  console.log(data);
  document.querySelector(`${ID4} a.new`).click(); // 初期化
  getId4data(); // 再表示
});
// シーズンタブ ID4------------------------------
// 役タブ ID5------------------------------
let id5FieldsList = ["official", "haruzo"];
let getId5data = async () => {
  let data = await window.eAPI.accessDb("YAKU", "select", null, {
    cond: null,
    fields: `OID,${id5FieldsList.join(",")}`,
  });
  let html = "";
  // console.log(data);
  data.forEach((d) => {
    html += `<tr>`;
    html += id5FieldsList.reduce((l, f) => l + `<td>${d[f]}</td>`, ``);
    html += `<td><i class="btn btn-sm btn-dark me-1 py-0 fas fa-edit" rowid="${d.rowid}"></i>
    <i class="btn btn-sm btn-dark me-1 py-0 fas fa-trash-can" rowid="${d.rowid}"></i></td></tr>`;
  });
  document.querySelector(`${ID5} tbody`).innerHTML = html;
  document.querySelectorAll(`${ID5} i.fa-edit`).forEach((e, i) => {
    e.addEventListener("click", () => {
      let d = data.filter((d) => d.rowid == e.getAttribute("rowid"))[0];
      document.querySelector(`${ID5} input[name='rowid']`).value = d.rowid;
      id5FieldsList.forEach((f) => {
        document.querySelector(`${ID5} input[name='${f}']`).value = d[f];
      });
      document.querySelector(`${ID5} .mode`).textContent = "編集";
      document.querySelector(`${ID5} .mode`).classList.add("text-warning");
    });
  });
  document.querySelectorAll(`${ID5} i.fa-trash-can`).forEach((e, i) => {
    e.addEventListener("click", async () => {
      console.log("trash");
      let rowid = e.getAttribute("rowid");
      if (rowid) {
        where = `rowid = ${rowid}`;
        let data = await window.eAPI.accessDb("YAKU", "delete", null, { cond: where });
        console.log(data);
        getId5data(); // 再表示
      }
    });
  });
};
document.querySelector(`${ID5} button.redisp`).addEventListener("click", getId5data);
document.querySelector(`${ID5} a.new`).addEventListener("click", () => {
  document.querySelector(`${ID5} input[name='rowid']`).value = "";
  id5FieldsList.forEach((f) => {
    document.querySelector(`${ID5} input[name='${f}']`).value = "";
  });
  document.querySelector(`${ID5} .mode`).textContent = "新規";
  document.querySelector(`${ID5} .mode`).classList.remove("text-warning");
});
document.querySelector(`${ID5} button.save`).addEventListener("click", async () => {
  let saveData = [[]];
  id5FieldsList.forEach((f) => {
    saveData[0].push(document.querySelector(`${ID5} input[name='${f}']`).value);
  });
  let where = "";
  let method = "insert";
  let rowid = document.querySelector(`${ID5} input[name='rowid']`).value;
  if (rowid) {
    method = "update";
    where = `rowid = ${rowid}`;
    let tmp = {};
    id5FieldsList.forEach((f, i) => {
      tmp[f] = saveData[0][i];
    });
    saveData = tmp;
  }
  let data = await window.eAPI.accessDb("YAKU", method, null, { recs: saveData, cond: where });
  console.log(data);
  getId5data(); // 再表示
});
// 役タブ ID5------------------------------

// タブクリック時の初期動作
document.querySelectorAll(`li.nav-item>a`).forEach((e, i) => {
  let tabId = e.getAttribute("href");
  switch (tabId) {
    case ID1:
      break;
    case ID3:
      break;
    case ID4:
      e.addEventListener("click", async () => {
        getId4data();
      });
      break;
    case ID5:
      e.addEventListener("click", async () => {
        getId5data();
      });
      break;
    case ID6:
      break;
  }
});
