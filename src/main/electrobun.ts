// Electrobun 主进程入口
import Electrobun from "electrobun";

const { BrowserWindow } = Electrobun;

// 创建主窗口
const mainWindow = new BrowserWindow({
  title: "摇光 - 摄像头AI助手",
  frame: {
    x: 100,
    y: 100,
    width: 1280,
    height: 800,
  },
  url: "http://localhost:5173", // 开发时使用 Vite 开发服务器
  html: null,
  preload: null,
  viewsRoot: null,
  renderer: "native",
  titleBarStyle: "default",
  transparent: false,
  passthrough: false,
  hidden: false,
  navigationRules: null,
  sandbox: false,
});

// 窗口准备好后显示
mainWindow.show();

console.log("摇光 - Electrobun 主进程已启动");
