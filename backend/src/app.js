const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const apiRoutes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

// Middleware to capture raw body for webhook signature verification
app.use(express.json({ verify: (req, res, buf, encoding) => {
  req.rawBody = buf.toString(encoding || 'utf8');
} }));

app.use('/api', apiRoutes);

const WEB_DEV_URL = process.env.WEB_DEV_URL || 'http://localhost:3001';

app.get('/', (_req, res) => {
  res.json({
    success: true,
    service: 'UniMove Node.js API',
    message: 'Đây là backend API — không phải giao diện web.',
    web: WEB_DEV_URL,
    health: '/api/health',
  });
});

app.get('/login', (_req, res) => res.redirect(302, `${WEB_DEV_URL}/login`));

/** PayOS redirect fallback — nếu APP_URL trỏ nhầm backend */
app.get('/payment-success', (req, res) => {
  const q = new URLSearchParams(req.query).toString();
  res.redirect(302, `${WEB_DEV_URL}/payment-success${q ? `?${q}` : ''}`);
});

app.get('/payment-cancel', (req, res) => {
  const q = new URLSearchParams(req.query).toString();
  res.redirect(302, `${WEB_DEV_URL}/payment-cancel${q ? `?${q}` : ''}`);
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
