const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("eAPI", {
  openFile: (a) => {
    console.log("22222222", a);
    ipcRenderer.invoke("dialog:openFile", a);
  },
  accessDb: (tName, method, year, params) => {
    // console.log("accessdb", arguments[0]);
    return ipcRenderer.invoke("accessDb", tName, method, year, params);
  },
  extractedData: (year) => {
    // console.log("accessdb", arguments[0]);
    return ipcRenderer.invoke("extractedData", year);
  },
  convert: (data) => {
    // console.log("accessdb", arguments[0]);
    return ipcRenderer.invoke("convert", data);
  },
  extract: (data) => {
    // console.log("accessdb", arguments[0]);
    return ipcRenderer.invoke("extract", data);
  },
});
// Node.jsのすべてのAPIがプリロード処理で利用可能です。
// Chromeの拡張機能と同じサンドボックスを持っています。
window.addEventListener("DOMContentLoaded", () => {
  ipcRenderer.on("test1", (_event, value) => {
    console.log("ssssssssssssssssssssssss");
    document.querySelector("#t3 .output").textContent = value;
  });
});
