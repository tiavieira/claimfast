import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth.routes';
import { policyRouter } from './routes/policy.routes';
import { claimRouter } from './routes/claim.routes';
import { insurerRouter } from './routes/insurer.routes';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '5mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'claimfast', ts: new Date().toISOString() }));

app.use('/api/auth',     authRouter);
app.use('/api/policies', policyRouter);
app.use('/api/claims',   claimRouter);
app.use('/api/insurer',  insurerRouter);

export default app;
