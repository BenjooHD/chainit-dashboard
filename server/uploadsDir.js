const fs = require('fs');
const path = require('path');

// Lives next to the SQLite file so it sits on the same persistent volume in production.
const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'chainit.db');
const uploadsDir = path.join(path.dirname(dbPath), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

module.exports = uploadsDir;
