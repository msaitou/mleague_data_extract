const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("eAPI", {
  openFile: (a) => {
    console.log("22222222", a);
    ipcRenderer.invoke("dialog:openFile", a);
  },
  accessDb: (tName, method, year, cond, rec) => {
    console.log("accessdb", arguments[0]);
    return ipcRenderer.invoke("accessDb", tName, method, year, cond, rec);
  },
});
// Node.jsのすべてのAPIがプリロード処理で利用可能です。
// Chromeの拡張機能と同じサンドボックスを持っています。
window.addEventListener("DOMContentLoaded", () => {
  // DOM要素のテキストを変更します
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) {
      element.textContent = text;
    }
  };
  for (const dependency of ["chrome", "node", "electron"]) {
    // HTMLページ内の文言を差し替えます
    replaceText(`${dependency}-version`, process.versions[dependency]);
  }
});
