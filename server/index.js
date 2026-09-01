require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const cors = require('cors');

const initDb = require('./db/init');
const SqliteSessionStore = require('./sessionStore');
const requireAuth = require('./middleware/requireAuth');
const requireAdmin = require('./middleware/requireAdmin');

const authRouter = require('./routes/auth');
const tasksRouter = require('./routes/tasks');
const eventsRouter = require('./routes/events');
const contactsRouter = require('./routes/contacts');
const statsRouter = require('./routes/stats');
const adminRouter = require('./routes/admin');
const messagesRouter = require('./routes/messages');
const projectsRouter = require('./routes/projects');
const documentsRouter = require('./routes/documents');
const notificationsRouter = require('./routes/notifications');
const searchRouter = require('./routes/search');
const mailRouter = require('./routes/mail');
const agendaRouter = require('./routes/agenda');
const costsRouter = require('./routes/costs');
const invoicesRouter = require('./routes/invoices');
const { scheduleReminders } = require('./reminders');

initDb();
SqliteSessionStore.sweepExpired();
scheduleReminders();

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

if (IS_PRODUCTION) {
  // Behind Railway/Render's reverse proxy, so express-session can trust the
  // proxy's X-Forwarded-Proto header when deciding whether the connection is secure.
  app.set('trust proxy', 1);
} else if (process.env.CLIENT_ORIGIN) {
  // Only needed in dev, where Vite (5173) and the API (3001) run on different origins.
  app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
}

app.use(express.json());
app.use(
  session({
    store: new SqliteSessionStore(),
    name: 'connect.sid',
    secret: process.env.SESSION_SECRET || 'chainit-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: IS_PRODUCTION,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.use('/api/auth', authRouter);
app.use('/api/tasks', requireAuth, tasksRouter);
app.use('/api/events', requireAuth, eventsRouter);
app.use('/api/contacts', requireAuth, contactsRouter);
app.use('/api/stats', requireAuth, statsRouter);
app.use('/api/admin', requireAuth, requireAdmin, adminRouter);
app.use('/api/messages', requireAuth, messagesRouter);
app.use('/api/projects', requireAuth, projectsRouter);
app.use('/api/documents', requireAuth, documentsRouter);
app.use('/api/notifications', requireAuth, notificationsRouter);
app.use('/api/search', requireAuth, searchRouter);
app.use('/api/mail', requireAuth, mailRouter);
app.use('/api/agenda', requireAuth, agendaRouter);
app.use('/api/costs', requireAuth, costsRouter);
app.use('/api/invoices', requireAuth, invoicesRouter);

if (IS_PRODUCTION) {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`ChainIt API listening on http://localhost:${PORT}`);
});
