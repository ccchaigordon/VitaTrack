const express = require('express');
const cors = require('cors');
const supabaseAuth = require('./src/routes/auth');
const udmRoutes = require('./src/routes/udm');
const acmRoutes = require('./src/routes/acm');

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  })
);

app.use(express.json());

// AI Conversational and Recommendation APIs (will integrate with auth later)
app.use('/api', acmRoutes);

// User & Data Management APIs (auth-required)
app.use('/api', supabaseAuth, udmRoutes);


const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Vitatrack API running at http://localhost:${PORT}`);
});
