const os = require('os')
const path = require('path')

const platform = os.platform()
let executablePath = null

if (platform === 'linux' || platform === 'android') {
  // Linux/Android 平台，优先使用系统已安装的浏览器
  const possiblePaths = [
    'chromium',
    'chromium-browser', 
    'chrome',
    'google-chrome'
  ]
  
  for (const browserName of possiblePaths) {
    try {
      executablePath = require('which').sync(browserName)
      break
    } catch (e) {
      // 继续尝试下一个
    }
  }
} else if (platform === 'darwin') {
  // macOS 平台，检查常见安装路径
  const macPaths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
  ]
  
  for (const browserPath of macPaths) {
    if (require('fs').existsSync(browserPath)) {
      executablePath = browserPath
      break
    }
  }
} else if (platform === 'win32') {
  // Windows 平台，检查 Program Files
  const winPaths = [
    process.env.PROGRAMFILES + '\\Google\\Chrome\\Application\\chrome.exe',
    process.env['PROGRAMFILES(X86)'] + '\\Google\\Chrome\\Application\\chrome.exe',
    process.env.PROGRAMFILES + '\\Microsoft\\Edge\\Application\\msedge.exe',
    process.env['PROGRAMFILES(X86)'] + '\\Microsoft\\Edge\\Application\\msedge.exe'
  ]
  
  for (const browserPath of winPaths) {
    if (require('fs').existsSync(browserPath)) {
      executablePath = browserPath
      break
    }
  }
}

/**
 * @type {import("playwright").Configuration}
 */
module.exports = {
  executablePath,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
}