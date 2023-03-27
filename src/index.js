document.querySelector("#key").addEventListener("click", async () => {
  const filePath = await window.eAPI.openFile("weee");
});
document.querySelector("#test").addEventListener("click", async () => {
  let data = await window.eAPI.accessDb("YAKU", "select");
  let html = "";
  data.forEach(d => {
    html +=`<tr><td>${d.official}</td><td>${d.haruzo}</td><td><button class="btn btn-sm">編集</button><button class="btn btn-sm">削除</button></td></tr>`
  });
  document.querySelector("#t5 tbody").innerHTML = html;
});
