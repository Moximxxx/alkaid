// Electrobun 主进程入口
import { BrowserWindow } from "electrobun/bun";

// 创建主窗口
const mainWindow = new BrowserWindow({
  title: "摇光 - 摄像头AI助手",
  frame: {
    width: 1280,
    height: 800,
  },
  url: "http://localhost:5173",
});

console.log("Yaoguang - Electrobun main process started");
console.log("Window created. Make sure Vite dev server is running at http://localhost:5173");
