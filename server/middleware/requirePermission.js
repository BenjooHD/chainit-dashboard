const db = require('../db/connection');

/**
 * Gates a route behind per-area access. Admins bypass this entirely.
 * A user with no `permissions` row for the area has no access at all.
 */
function requirePermission(area, level) {
  const column = level === 'edit' ? 'can_edit' : 'can_view';

  return (req, res, next) => {
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.session.userId);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    if (user.is_admin) return next();

    const perm = db
      .prepare(`SELECT ${column} AS allowed FROM permissions WHERE user_id = ? AND area = ?`)
      .get(req.session.userId, area);

    if (!perm || !perm.allowed) {
      return res.status(403).json({ error: 'You do not have access to this area', code: 'NO_PERMISSION' });
    }
    next();
  };
}

module.exports = requirePermission;
