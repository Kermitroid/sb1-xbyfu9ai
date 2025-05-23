import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logsDir = path.join(__dirname, '../logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const getTimestamp = () => new Date().toISOString();

const writeLog = (level, message, meta = {}) => {
  const logEntry = {
    timestamp: getTimestamp(),
    level,
    message,
    ...meta
  };

  const logString = JSON.stringify(logEntry) + '\n';

  // Write to console
  if (level === 'error') {
    console.error(`[${level.toUpperCase()}] ${message}`, meta);
  } else {
    console.log(`[${level.toUpperCase()}] ${message}`, meta);
  }

  // Write to file
  const logFile = path.join(logsDir, `${level}.log`);
  fs.appendFileSync(logFile, logString);

  // Also write to combined log
  const combinedFile = path.join(logsDir, 'combined.log');
  fs.appendFileSync(combinedFile, logString);
};

export const logger = {
  info: (message, meta) => writeLog('info', message, meta),
  warn: (message, meta) => writeLog('warn', message, meta),
  error: (message, meta) => writeLog('error', message, meta),
  debug: (message, meta) => {
    if (process.env.NODE_ENV === 'development') {
      writeLog('debug', message, meta);
    }
  }
};

// Request logger middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };

    if (res.statusCode >= 400) {
      logger.warn(`HTTP ${res.statusCode}`, logData);
    } else {
      logger.info(`HTTP ${res.statusCode}`, logData);
    }
  });

  next();
};
