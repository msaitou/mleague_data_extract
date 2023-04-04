const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("eAPI", {
  accessDb: (tName, method, year, params) => {
    return ipcRenderer.invoke("accessDb", tName, method, year, params);
  },
  extractedData: (year) => {
    return ipcRenderer.invoke("extractedData", year);
  },
  convert: (data) => {
    return ipcRenderer.invoke("convert", data);
  },
  extract: (data) => {
    return ipcRenderer.invoke("extract", data);
  },
});
// Node.jsのすべてのAPIがプリロード処理で利用可能です。
// Chromeの拡張機能と同じサンドボックスを持っています。
window.addEventListener("DOMContentLoaded", () => {
  ipcRenderer.on("setVersion", (_event, value) => {
    console.log(value);
    document.querySelector("title").textContent += "ver"+value;
  });
  ipcRenderer.on("dispLog", (_event, value) => {
    let div = document.querySelector(" .log>div");
    div.innerHTML += value +"<br>";
    div.scrollIntoView(false);
  });
});
