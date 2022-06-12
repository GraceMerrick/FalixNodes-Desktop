const {app, BrowserWindow, dialog, ipcMain, ipcRenderer, nativeTheme, protocol, powerMonitor, session, webContents, shell} = require('electron')
const Pushy = require('pushy-electron')
const exec = require('child_process')
const PowerShell = require('powershell')
const glasstron = require('glasstron')
const log = require('electron-log')
const path = require('path')
var commandExistsSync = require('command-exists').sync
function execute(command) {exec(command)}

// Overwrite 'console.log' with 'log`
console.log = log.info
console.error = log.error
Object.assign(console, log.functions)

// Platform Check
if (process.platform = 'win32') {
    global.blur = 'acrylic'
} else if (proc.platform = 'darwin') {
    global.blur = 'vibrancy'
    global.update = log.error('Auto update not supported on this platform.')
} else if (proc.platform = 'linux') {
    global.blur = 'blurbehind'
}

// App
const createMainWindow = () => {
  primaryWindow = new glasstron.BrowserWindow({
    width: 1200,
    height: 800,
    minHeight: 590,
    minWidth: 720,
    autoHideMenuBar: true,
    frame: true,
    blur: true,
    blurType: global.blur,
    titleBarStyle: 'hidden',
    trafficLightPosition: {
      x: 20,
      y: 28,
    },
    titleBarOverlay: {
      color: '#161616',
      symbolColor: 'white'
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false,
    }
  })
  primaryWindow.loadFile('src/index.html')

  ipcMain.on('logout', () => {(logout())})
  ipcMain.on('relaunch', () => {(relaunch())})

  // Mullvad VPN - Windows and Linux are supported. macOS support will come later.
  ipcMain.on('loginVPN', () => {
    if (process.platform = 'linux') {
      exec(`
      MULLID=$( zenity --entry --text="Type in your Mullvad Account Number" )

      if [ $? = 0 ]
      then
          mullvad account set $MULLID
      else
          echo "Mullvad login was cancelled."
      fi
      `);
    }
    else if (process.platform = 'win32') {
      let ps = new PowerShell(`
      Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.Interaction]::InputBox('Your Mullvad Account Number:', 'FalixNodes Desktop - External Mullvad Login') > mull-id.tmp
      $MULLVADID = Get-Content -Path mull-id.tmp -RAW

      mullvad.exe account set $MULLVADID > mullvad-login.txt
      $MULLVADMSG1 = Get-Content -Path mullvad-login.txt -RAW

      Add-Type -AssemblyName PresentationFramework;[System.Windows.MessageBox]::($MULLVADMSG1)
      `)
    }
    primaryWindow.webContents.executeJavaScript('document.querySelector(".sContainer#MULLVAD-FAILED").style.display = "none";')
  })
  
  ipcMain.on('enableVPN', () => {
    if (process.platform = 'linux') {exec("mullvad connect")}
    else if (process.platform = 'win32') {exec(`
      cd\Program Files\Mullvad VPN\resources
      mullvad connect
    `);};
  })
  ipcMain.on('disableVPN', () => {
    if (process.platform = 'linux') {exec("mullvad disconnect")}
    else if (process.platform = 'win32') {exec(`
      cd\Program Files\Mullvad VPN\resources
      mullvad disconnect
    `);};
  })
  ipcMain.on('ukVPN', () => {
    if (process.platform = 'linux') {exec("mullvad relay set location uk")}
    else if (process.platform = 'win32') {exec(`
      cd\Program Files\Mullvad VPN\resources
      mullvad relay set location uk
    `);};
  })
  ipcMain.on('usVPN', () => {
    if (process.platform = 'linux') {exec("mullvad relay set location us")}
    else if (process.platform = 'win32') {exec(`
      cd\Program Files\Mullvad VPN\resources
      mullvad relay set location us
    `);};
  })
  ipcMain.on('deVPN', () => {
    if (process.platform = 'linux') {exec("mullvad relay set location de")}
    else if (process.platform = 'win32') {exec(`
      cd\Program Files\Mullvad VPN\resources
      mullvad relay set location de
    `);};
  })
  ipcMain.on('auVPN', () => {
    if (process.platform = 'linux') {exec("mullvad relay set location au")}
    else if (process.platform = 'win32') {exec(`
      cd\Program Files\Mullvad VPN\resources
      mullvad relay set location au
    `);};
  })

  // Notifications System - Powered by Pushy
  primaryWindow.webContents.on('did-finish-load', () => {Pushy.listen();});
  Pushy.register({ appId: '62a020bfca130a4f54f56b4f' }).then((deviceToken) => {});
  if (Pushy.isRegistered()) {Pushy.subscribe('primary').then(() => {});}

  Pushy.setNotificationListener((data) => {
    primaryWindow.webContents.executeJavaScript(`
    document.getElementById("notification-amount").style.opacity = '1';
    document.getElementById("notification-amount").stepUp(1);
    document.querySelector('.tabs#notifications hr').insertAdjacentHTML("afterEnd", "<notification><div class='header'><h1>` + data.icon + `` + data.title + `</h1></div><div class='n-content'>` + data.message + `</div><div class=actions><button>Dismiss</button> ` + data.action + `</div></div></notification>")
    `)
  });

  // Etc
  if (nativeTheme.shouldUseDarkColors) {
    log.info('Native Theme: Dark')
  } else {
    log.info('Native Theme: Light')
  }

  if (__dirname.includes('\\WindowsApps\\')) {
    log.error('The built-in auto updater is not supported on Microsoft Store, please use the Microsoft Store to update FalixNodes Desktop.');
  }
  else {
    // global.update = autoUpdater.checkForUpdates();
  }
  const ses = primaryWindow.webContents.session
  function logout() {ses.clearCache(); log.info('LOGGING OUT');}
  if (commandExistsSync('mullvad')) {
  } else {
    setTimeout(() => {
      log.error('Mullvad was not detected.')
      primaryWindow.webContents.executeJavaScript('document.querySelector(".sContainer#MULLVAD-NOT-FOUND").style.display = "grid"; document.querySelector(".sContainer#mullvad-install").style.display = "inherit"; document.querySelector("vpn .vpn-connection").style.backgroundColor = "rgb(255 0 0 / 30%)";  document.querySelector("vpn .vpn-connection").style.boxShadow = "0px 0px 0px 20px rgb(255 0 0 / 10%)"')
    }, 5000); // Element doesn't load instantly
  }
}

function relaunch() {
  app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) })
  app.exit(0)
}
app.on('ready', createMainWindow);