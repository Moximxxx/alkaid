const fs = require('fs');
const path = require('path');

function createLogger(userDataPath) {
  const logDir = path.join(userDataPath, 'logs');
  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  } catch (err) {
    console.error(`[Logger] Failed to create log directory: ${err.message}`);
  }

  function getLogFile() {
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return path.join(logDir, `app-${date}.log`);
  }

  function write(level, message, source = 'main') {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${level.toUpperCase()}] [${source}] ${message}\n`;
    try {
      fs.appendFileSync(getLogFile(), line, 'utf8');
    } catch (err) {
      console.error(`[Logger] Failed to write log: ${err.message}`);
    }
  }

  // 清理超过 15 天的旧日志
  function cleanup() {
    const files = fs.readdirSync(logDir);
    const cutoff = Date.now() - 15 * 24 * 60 * 60 * 1000;
    files.forEach(f => {
      const match = f.match(/^app-(\d{4}-\d{2}-\d{2})\.log$/);
      if (match && new Date(match[1]).getTime() < cutoff) {
        fs.unlinkSync(path.join(logDir, f));
      }
    });
  }

  // 每次写入后尝试清理（低频操作）
  let lastCleanup = 0;
  function maybeCleanup() {
    const now = Date.now();
    if (now - lastCleanup > 60 * 60 * 1000) { // 每小时清理一次
      lastCleanup = now;
      try { cleanup(); } catch (err) {
        console.error(`[Logger] Cleanup failed: ${err.message}`);
      }
    }
  }

  return {
    debug: (msg, src) => { write('debug', msg, src); maybeCleanup(); },
    info:  (msg, src) => { write('info',  msg, src); maybeCleanup(); },
    warn:  (msg, src) => { write('warn',  msg, src); maybeCleanup(); },
    error: (msg, src) => { write('error', msg, src); maybeCleanup(); },
    logDir: () => logDir,
  };
}

module.exports = { createLogger };
