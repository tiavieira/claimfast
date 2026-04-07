import app from './app';
import { runMigrations } from './db/migrate';

const PORT = process.env.PORT ?? 3002;

runMigrations();

app.listen(PORT, () => {
  console.log(`🚀 ClaimFast API → http://localhost:${PORT}`);
});
