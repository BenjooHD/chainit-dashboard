const db = require('./db/connection');

function notify(userId, type, message, link) {
  db.prepare('INSERT INTO notifications (user_id, type, message, link) VALUES (?, ?, ?, ?)').run(
    userId,
    type,
    message,
    link || null
  );
}

module.exports = { notify };
