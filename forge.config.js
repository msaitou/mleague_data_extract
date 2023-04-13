// var electronInstaller = require("electron-winstaller");
// resultPromise = electronInstaller.createWindowsInstaller({
//   appDirectory: "/tmp/build/my64",
//   outputDirectory: "/tmp/build/installer64",
//   authors: "saito masato",
//   exe: "myapp.exe",
// });

// resultPromise.then(
//   () => console.log("It worked!"),
//   (e) => console.log(`No dice: ${e.message}`)
// );
module.exports = {
  packagerConfig: {
    icon: "src/image/m", // no file extension required
    // asar: true,
    // ignore: [".vscode", "log", "data"],
    // ignore: [".vscode", ".gitignore", ".package-lock.json", "^(/log$)", "^(/bin$)"], // 最初用
    ignore: [".vscode", ".gitignore",".package-lock.json","^(\/log$)", "^(\/bin$)", "^(\/data$)"],  // 以降の更新用
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        authors: "masatosaito",
        description: "Mリーグのスタッツデータを抽出解析します。",
        iconUrl:
          "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhtmmO3zZyAZ6JuiKQOO51NAV9raL77S5GSYhM-HQHFTCA-m74dXT1gLhGf7y5NMXt-kh_1oFWJFjf4-bswdPsF8Yu8CnJ22hRQNFYAwNG_k1N6K0VDIBCdZq-Sz5dntvU9E7tAbFYkrcHuQdginLtZfsY6U8ZXog5762AZ1D3LYNPOZ0Ntk6ku789-eg/s128/m.ico",
        // The ICO file to use as the icon for the generated Setup.exe
        setupIcon: "src/image/m.ico",
        setupExe: "m_setup.exe",
        // noMsi: false,
        // name: "Mリーグのスタッツデータ抽出解析",
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          icon: "src/image/m.png", // no file extension required
        },
      },
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      platforms: ["win32"],
      config: {
        repository: {
          owner: "msaitou",
          name: "mleague_data_extract",
        },
      },
    },
  ],
};
