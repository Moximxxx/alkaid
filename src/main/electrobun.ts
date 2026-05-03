// Electrobun 主进程入口
import { BrowserWindow } from "electrobun/bun";

console.log("[DEBUG] Electrobun version check");
console.log("[DEBUG] Creating BrowserWindow...");

try {
  const mainWindow = new BrowserWindow({
    title: "Yaoguang - Camera AI Assistant",
    frame: {
      x: 100,
      y: 100,
      width: 1280,
      height: 800,
    },
    url: "http://localhost:5173",
  });

  console.log("[DEBUG] BrowserWindow created successfully");
  console.log("[DEBUG] mainWindow.id:", mainWindow.id);
  console.log("[DEBUG] mainWindow.webview:", mainWindow.webview);

  // 监听事件
  mainWindow.on("focus", () => {
    console.log("[DEBUG] Window focus event");
  });

  mainWindow.on("blur", () => {
    console.log("[DEBUG] Window blur event");
  });

  mainWindow.on("resize", (e) => {
    console.log("[DEBUG] Window resize event:", e.data);
  });

  mainWindow.on("move", (e) => {
    console.log("[DEBUG] Window move event:", e.data);
  });

  console.log("Yaoguang - Electrobun main process started");
  console.log("Window created. Make sure Vite dev server is running at http://localhost:5173");
} catch (err) {
  console.error("[DEBUG] Error creating BrowserWindow:", err);
}
