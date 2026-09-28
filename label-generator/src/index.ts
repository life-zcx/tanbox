import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import labelsRoutes from './routes/labels.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5060;

// Enable CORS for all internal origins and admin panel
app.use(cors({ origin: true, credentials: true }));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Healthcheck
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'tanbox-label-generator-microservice',
    timestamp: new Date().toISOString(),
  });
});

// Microservice Routes
app.use('/api/labels', labelsRoutes);

app.listen(PORT, () => {
  console.log(`🏷️ TANBOX Label Generator Microservice running on port ${PORT}`);
});
