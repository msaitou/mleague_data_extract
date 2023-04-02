module.exports = {
  packagerConfig: {
    icon: "src/image/m",
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {},
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          icon: "src/image/m.png",
        },
      },
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
    {
      name: '@electron-forge/maker-wix',
      config: {
        language: 1033,
        manufacturer: 'My Awesome Company'
      }
    },
  ],
};
