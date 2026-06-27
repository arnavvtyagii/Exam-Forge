const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const studySetsRoutes = require('./routes/studySets');
const sessionsRoutes = require('./routes/sessions');
const analyticsRoutes = require('./routes/analytics');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' })); // large for PDF text

app.use('/api/auth', authRoutes);
app.use('/api/study-sets', studySetsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`ExamForge server running on port ${PORT}`));
