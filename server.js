import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

import semantiqConfig from './config/semantiq.config.js';
import authRoutes from './routes/authRoutes.js';
import cartiqueRoutes from './routes/cartiqueRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Root health check
app.get('/', (req, res) => {
  res.json({ status: 'Semantq Server is running' });
});

// Mount routes
app.use('/auth', authRoutes);
app.use('/cartique', cartiqueRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Semantq Server running on port ${PORT} (Env: ${process.env.NODE_ENV || 'development'})`);
});
