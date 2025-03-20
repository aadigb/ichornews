import express from 'express';
import dotenv from 'dotenv';
import { initDb } from './db/database';
import newsRoutes from './routes/newsRoutes';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize database
initDb();

// Routes
app.use('/api', newsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
