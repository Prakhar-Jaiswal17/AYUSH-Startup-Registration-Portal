const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('desktopInfo', {
  platform: process.platform,
  version: '1.0.0'
})
