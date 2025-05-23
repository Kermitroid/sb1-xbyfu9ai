import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '../data');
const dbFile = path.join(dbDir, 'database.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database file if it doesn't exist
if (!fs.existsSync(dbFile)) {
  const initialData = {
    users: [],
    videos: [],
    comments: [],
    lastUpdated: new Date().toISOString()
  };
  fs.writeFileSync(dbFile, JSON.stringify(initialData, null, 2));
}

export const db = {
  read() {
    try {
      const data = fs.readFileSync(dbFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading database:', error);
      return { users: [], videos: [], comments: [] };
    }
  },

  write(data) {
    try {
      const dataWithTimestamp = {
        ...data,
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(dbFile, JSON.stringify(dataWithTimestamp, null, 2));
    } catch (error) {
      console.error('Error writing database:', error);
    }
  },

  // Auto-save every 30 seconds
  startAutoSave(getData) {
    setInterval(() => {
      const data = getData();
      this.write(data);
    }, 30000);
  }
};
