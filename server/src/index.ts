import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import cron from 'node-cron';
import { AppDataSource } from './data-source';
import fundRoutes from './routes/fundRoutes';
import { getFundQuotes } from './services/fundService';
import { DailyData } from './entity/DailyData';
import { Fund } from './entity/Fund';

dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', fundRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

function isTradingDay(date: Date = new Date()): boolean {
  const day = date.getDay();
  if (day === 0 || day === 6) {
    return false;
  }
  
  const holidays2025 = [
    '2025-01-01', '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31', '2025-02-01', '2025-02-02', '2025-02-03', '2025-02-04',
    '2025-04-04', '2025-04-05', '2025-04-06',
    '2025-05-01', '2025-05-02', '2025-05-03', '2025-05-04', '2025-05-05',
    '2025-05-31', '2025-06-01', '2025-06-02',
    '2025-10-01', '2025-10-02', '2025-10-03', '2025-10-04', '2025-10-05', '2025-10-06', '2025-10-07', '2025-10-08',
  ];
  
  const dateStr = date.toISOString().split('T')[0];
  return !holidays2025.includes(dateStr);
}

async function refreshFundData() {
  const now = new Date();
  
  if (!isTradingDay(now)) {
    console.log('Today is not a trading day, skipping refresh...');
    return;
  }
  
  try {
    console.log('Starting scheduled data refresh...');
    const funds = await AppDataSource.getRepository(Fund).find();
    const fundCodes = funds.map((f) => f.fundCode);
    
    if (fundCodes.length === 0) {
      console.log('No funds to refresh');
      return;
    }

    const quotes = await getFundQuotes(fundCodes);
    const today = now.toISOString().split('T')[0];
    const dailyDataRepo = AppDataSource.getRepository(DailyData);

    for (const quote of quotes) {
      const existingData = await dailyDataRepo
        .createQueryBuilder('d')
        .where('d.fundCode = :fundCode AND d.date = :date', { fundCode: quote.fundCode, date: today })
        .getOne();

      if (existingData) {
        existingData.nav = quote.nav;
        existingData.dailyChange = quote.dailyChange;
        await dailyDataRepo.save(existingData);
      } else {
        const dailyData = dailyDataRepo.create({
          fundCode: quote.fundCode,
          nav: quote.nav,
          dailyChange: quote.dailyChange,
          date: today
        });
        await dailyDataRepo.save(dailyData);
      }
    }
    
    console.log(`Scheduled refresh completed: ${quotes.length} funds updated`);
  } catch (error) {
    console.error('Scheduled refresh failed:', error);
  }
}

cron.schedule('0 15 * * *', () => {
  console.log('Running scheduled refresh at 15:00 (3 PM)...');
  refreshFundData();
});

cron.schedule('0 21 * * *', () => {
  console.log('Running scheduled refresh at 21:00 (9 PM)...');
  refreshFundData();
});

AppDataSource.initialize()
  .then(() => {
    console.log('Database connected successfully');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });
