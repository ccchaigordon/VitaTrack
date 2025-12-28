const express = require('express');
const cors = require('cors');
const supabaseAuth = require('./src/routes/auth');
const udmRoutes = require('./src/routes/udm');
const acmRoutes = require('./src/routes/acm');
const crmRoutes = require('./src/routes/crm');
const ptfRoutes = require('./src/routes/ptf');

const app = express();

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());

// Fix Chrome CORB
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// AI Conversational and Recommendation APIs (will integrate with auth later)
app.use('/api', supabaseAuth, acmRoutes);

// Progress Tracking & Feedback APIs
app.use('/api', supabaseAuth, ptfRoutes);

// Health & Meal/Workout Tracking APIs (CRM)
app.use('/api', supabaseAuth, crmRoutes);

// User & Data Management APIs (auth-required)
app.use('/api', supabaseAuth, udmRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Vitatrack API running at http://localhost:${PORT}`);
});
