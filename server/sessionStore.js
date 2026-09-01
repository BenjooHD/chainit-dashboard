const session = require('express-session');
const db = require('./db/connection');

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days, matches the cookie maxAge

class SqliteSessionStore extends session.Store {
  get(sid, cb) {
    try {
      const row = db.prepare('SELECT sess, expires FROM sessions WHERE sid = ?').get(sid);
      if (!row) return cb(null, null);
      if (row.expires < Date.now()) {
        db.prepare('DELETE FROM sessions WHERE sid = ?').run(sid);
        return cb(null, null);
      }
      cb(null, JSON.parse(row.sess));
    } catch (err) {
      cb(err);
    }
  }

  set(sid, sess, cb) {
    try {
      const expires = sess.cookie && sess.cookie.expires
        ? new Date(sess.cookie.expires).getTime()
        : Date.now() + DEFAULT_TTL_MS;
      db.prepare(
        `INSERT INTO sessions (sid, sess, expires) VALUES (?, ?, ?)
         ON CONFLICT(sid) DO UPDATE SET sess = excluded.sess, expires = excluded.expires`
      ).run(sid, JSON.stringify(sess), expires);
      cb && cb(null);
    } catch (err) {
      cb && cb(err);
    }
  }

  destroy(sid, cb) {
    try {
      db.prepare('DELETE FROM sessions WHERE sid = ?').run(sid);
      cb && cb(null);
    } catch (err) {
      cb && cb(err);
    }
  }

  touch(sid, sess, cb) {
    this.set(sid, sess, cb);
  }
}

// Sweep expired rows once at boot so the table doesn't grow forever.
// Exposed as a function (not run at require-time) so callers control
// ordering relative to schema creation.
SqliteSessionStore.sweepExpired = function sweepExpired() {
  db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now());
};

module.exports = SqliteSessionStore;
