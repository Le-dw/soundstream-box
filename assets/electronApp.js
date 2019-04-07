const { createServer, get:httpGet} = require('http')
const path = require('path')
const { app, BrowserWindow} = require('electron')
const { Nuxt, Builder } = require('nuxt')
const config = require('../nuxt.config.js')
const os = require('os')


const isEnvDev = process.env.NODE_ENV === "DEV"
config.rootDir = path.join(__dirname, '../')
const nuxt = new Nuxt(config)
const builder = new Builder(nuxt)


if (isEnvDev) {
  builder.build().catch((err) => {
    /* eslint-disable no-alert, no-console */
    console.error(err) 
    /* eslint-enable no-alert, no-console */
    process.exit(1)
  })
}
const server = createServer(nuxt.render)
server.listen()
const _NUXT_URL_ = `http://localhost:${server.address().port}`
/* eslint-disable no-alert, no-console */
console.info('\x1b[33m%s\x1b[0m','Nuxt working on :',`\x1b[34m${_NUXT_URL_}\x1b[0m`)
/* eslint-enable no-alert, no-console */


let win = null 
const newWin = () => {
  let myIcon =  path.join(__dirname, '../static/icon.png')
  if(os.platform() === 'win32'){
    myIcon =  path.join(__dirname, '../static/icon.ico')
  }
  if(os.platform() === 'darwin'){
    myIcon =  path.join(__dirname, '../static/icon.icns')
  }

  win = new BrowserWindow({
    backgroundColor: '#303030',
    frame: false,
    width: 1600,
    height: 900,
    icon: myIcon,
    movable:true,
    show: false, 
    webPreferences: {
      webSecurity: false
    }
  })

  let splash = new BrowserWindow({
    width: 810, 
    height: 610, 
    transparent: true, 
    frame: false, 
    icon: myIcon,
    alwaysOnTop: true
  });
    splash.loadURL(path.join(__dirname, 'splashScreen/splash.html'));

  win.on('closed', () => { win = null })

  if (isEnvDev) {
    const websocket = require('ws');
    const { default: installExtension, VUEJS_DEVTOOLS } = require('electron-devtools-installer')
    new websocket.Server({ server });
    

    const pollServer = () => {
      httpGet(_NUXT_URL_, (res) => {
        if (res.statusCode === 200) { 
          win.loadURL(_NUXT_URL_) 
        } else { 
          setTimeout(pollServer, 300) 
        }
      }).on('error', pollServer)
    }
    pollServer()

    win.webContents.on('did-finish-load', () => {
      installExtension(VUEJS_DEVTOOLS.id).then((name) => {
        /* eslint-disable no-alert, no-console */
        console.info('\x1b[33m%s\x1b[0m','Added Extension:',`\x1b[34m${name}\x1b[0m`)
        /* eslint-enable no-alert, no-console */
        win.webContents.openDevTools()
      }).catch(
        /* eslint-disable no-alert, no-console */
        err => console.error('An error occurred: ', err)
        /* eslint-enable no-alert, no-console */
        )
    })
  }
  if (!isEnvDev) {
    win.loadURL(_NUXT_URL_)
  }
  win.once('ready-to-show', () => {
    splash.destroy();
    win.show();
    win.maximize()
  });
}

app.on('ready', newWin)
app.on('window-all-closed', () => app.quit())
app.on('activate', () => win === null && newWin())