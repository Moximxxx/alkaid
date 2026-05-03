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

console.log("摇光 - Electrobun 主进程已启动");
console.log("窗口已创建，请确保 Vite 开发服务器运行在 http://localhost:5173");
