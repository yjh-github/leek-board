import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Fund } from '../entity/Fund';
import { DailyData } from '../entity/DailyData';
import { getFundQuote, getFundQuotes } from '../services/fundService';

const router = Router();
const fundRepository = () => AppDataSource.getRepository(Fund);
const dailyDataRepository = () => AppDataSource.getRepository(DailyData);

router.get('/funds', async (req: Request, res: Response) => {
  try {
    const funds = await fundRepository().find();
    
    const fundsWithQuote = await Promise.all(
      funds.map(async (fund) => {
        const latestData = await dailyDataRepository()
          .createQueryBuilder('d')
          .where('d.fundCode = :fundCode', { fundCode: fund.fundCode })
          .orderBy('d.date', 'DESC')
          .limit(1)
          .getOne();

        const totalCost = Number(fund.cost) * Number(fund.shares);
        const currentValue = latestData ? Number(latestData.nav) * Number(fund.shares) : totalCost;
        const profit = currentValue - totalCost;
        const profitRate = totalCost > 0 ? (profit / totalCost) * 100 : 0;

        return {
          ...fund,
          nav: latestData?.nav || 0,
          dailyChange: latestData?.dailyChange || 0,
          currentValue: currentValue.toFixed(2),
          profit: profit.toFixed(2),
          profitRate: profitRate.toFixed(2),
          lastUpdateDate: latestData?.date
        };
      })
    );

    res.json(fundsWithQuote);
  } catch (error) {
    console.error('Error fetching funds:', error);
    res.status(500).json({ error: 'Failed to fetch funds' });
  }
});

router.post('/funds', async (req: Request, res: Response) => {
  try {
    const { fundCode, fundName, cost, shares, note, tags } = req.body;
    
    const existingFund = await fundRepository()
      .createQueryBuilder('f')
      .where('f.fundCode = :fundCode', { fundCode })
      .getOne();
    
    if (existingFund) {
      return res.status(400).json({ error: 'Fund already exists' });
    }

    let finalFundName = fundName || '';
    
    if (!finalFundName) {
      const quote = await getFundQuote(fundCode);
      if (quote && quote.fundName) {
        finalFundName = quote.fundName;
      } else {
        finalFundName = `基金 ${fundCode}`;
      }
    }

    const fund = fundRepository().create({ fundCode, fundName: finalFundName, cost, shares, note, tags: tags || '' });
    await fundRepository().save(fund);
    
    res.json(fund);
  } catch (error) {
    console.error('Error adding fund:', error);
    res.status(500).json({ error: 'Failed to add fund' });
  }
});

router.put('/funds/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fundCode, fundName, cost, shares, note, tags } = req.body;
    
    const fund = await fundRepository().findOne({ where: { id: parseInt(id as string) } });
    if (!fund) {
      return res.status(404).json({ error: 'Fund not found' });
    }

    fund.fundCode = fundCode || fund.fundCode;
    fund.fundName = fundName || fund.fundName;
    fund.cost = cost !== undefined ? cost : fund.cost;
    fund.shares = shares !== undefined ? shares : fund.shares;
    fund.note = note !== undefined ? note : fund.note;
    fund.tags = tags !== undefined ? tags : fund.tags;
    
    await fundRepository().save(fund);
    res.json(fund);
  } catch (error) {
    console.error('Error updating fund:', error);
    res.status(500).json({ error: 'Failed to update fund' });
  }
});

router.delete('/funds/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const fund = await fundRepository().findOne({ where: { id: parseInt(id as string) } });
    
    if (!fund) {
      return res.status(404).json({ error: 'Fund not found' });
    }

    await fundRepository().delete(parseInt(id as string));
    res.json({ message: 'Fund deleted successfully' });
  } catch (error) {
    console.error('Error deleting fund:', error);
    res.status(500).json({ error: 'Failed to delete fund' });
  }
});

router.post('/funds/refresh', async (req: Request, res: Response) => {
  try {
    const funds = await fundRepository().find();
    const fundCodes = funds.map(f => f.fundCode);
    
    const quotes = await getFundQuotes(fundCodes);
    const today = new Date().toISOString().split('T')[0];

    for (const quote of quotes) {
      const existingData = await dailyDataRepository()
        .createQueryBuilder('d')
        .where('d.fundCode = :fundCode AND d.date = :date', { fundCode: quote.fundCode, date: today })
        .getOne();

      if (existingData) {
        existingData.nav = quote.nav;
        existingData.dailyChange = quote.dailyChange;
        await dailyDataRepository().save(existingData);
      } else {
        const dailyData = dailyDataRepository().create({
          fundCode: quote.fundCode,
          nav: quote.nav,
          dailyChange: quote.dailyChange,
          date: today
        });
        await dailyDataRepository().save(dailyData);
      }
    }

    res.json({ message: 'Data refreshed successfully', updated: quotes.length });
  } catch (error) {
    console.error('Error refreshing data:', error);
    res.status(500).json({ error: 'Failed to refresh data' });
  }
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const funds = await fundRepository().find();
    
    let totalCost = 0;
    let totalValue = 0;
    let totalProfit = 0;
    let profitCount = 0;
    let lossCount = 0;

    for (const fund of funds) {
      const latestData = await dailyDataRepository()
        .createQueryBuilder('d')
        .where('d.fundCode = :fundCode', { fundCode: fund.fundCode })
        .orderBy('d.date', 'DESC')
        .limit(1)
        .getOne();

      const fundCost = Number(fund.cost) * Number(fund.shares);
      const fundValue = latestData ? Number(latestData.nav) * Number(fund.shares) : fundCost;
      const fundProfit = fundValue - fundCost;
      
      totalCost += fundCost;
      totalValue += fundValue;
      totalProfit += fundProfit;
      
      if (fundProfit >= 0) {
        profitCount++;
      } else {
        lossCount++;
      }
    }

    const totalProfitRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    res.json({
      totalCost: totalCost.toFixed(2),
      totalValue: totalValue.toFixed(2),
      totalProfit: totalProfit.toFixed(2),
      totalProfitRate: totalProfitRate.toFixed(2),
      fundCount: funds.length,
      profitCount,
      lossCount
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/history', async (req: Request, res: Response) => {
  try {
    const fundCode = req.query.fundCode as string;
    const period = (req.query.period as string) || 'all';
    
    const funds = await fundRepository().find();
    const targetFunds = fundCode ? funds.filter(f => f.fundCode === fundCode) : funds;
    
    const now = new Date();
    let startDate: Date | null = null;
    
    switch (period) {
      case '1m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '3m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '6m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '1y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = null;
    }
    
    const allDailyData = await dailyDataRepository()
      .createQueryBuilder('d')
      .orderBy('d.date', 'ASC')
      .getMany();

    const dateMap = new Map<string, { date: string; totalValue: number; totalCost: number; profit: number; nav: number }>();

    for (const fund of targetFunds) {
      const fundCost = Number(fund.cost) * Number(fund.shares);
      const fundDailyData = allDailyData.filter(d => d.fundCode === fund.fundCode);

      for (const data of fundDailyData) {
        const dateStr = data.date instanceof Date ? data.date.toISOString().split('T')[0] : String(data.date);
        
        if (startDate) {
          const dataDate = new Date(dateStr);
          if (dataDate < startDate) continue;
        }
        
        const existing = dateMap.get(dateStr) || { 
          date: dateStr, 
          totalValue: 0, 
          totalCost: 0, 
          profit: 0,
          nav: 0
        };
        existing.totalValue += Number(data.nav) * Number(fund.shares);
        existing.totalCost += fundCost;
        existing.nav = Number(data.nav);
        dateMap.set(dateStr, existing);
      }
    }

    const result = Array.from(dateMap.values())
      .map(item => ({
        date: item.date,
        totalValue: item.totalValue.toFixed(2),
        totalCost: item.totalCost.toFixed(2),
        profit: (item.totalValue - item.totalCost).toFixed(2),
        nav: item.nav
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    let maxDrawdown = 0;
    let maxDrawdownStart = '';
    let maxDrawdownEnd = '';
    
    if (result.length > 1) {
      let peak = parseFloat(result[0].totalValue);
      let peakDate = result[0].date;
      
      for (let i = 1; i < result.length; i++) {
        const currentValue = parseFloat(result[i].totalValue);
        
        if (currentValue > peak) {
          peak = currentValue;
          peakDate = result[i].date;
        } else {
          const drawdown = ((peak - currentValue) / peak) * 100;
          if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
            maxDrawdownStart = peakDate;
            maxDrawdownEnd = result[i].date;
          }
        }
      }
    }

    let periodReturn = 0;
    if (result.length >= 2) {
      const startValue = parseFloat(result[0].totalValue);
      const endValue = parseFloat(result[result.length - 1].totalValue);
      periodReturn = ((endValue - startValue) / startValue) * 100;
    }

    res.json({
      data: result,
      stats: {
        maxDrawdown: maxDrawdown.toFixed(2),
        maxDrawdownStart,
        maxDrawdownEnd,
        periodReturn: periodReturn.toFixed(2),
        dataPoints: result.length
      }
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

router.get('/export', async (req: Request, res: Response) => {
  try {
    const funds = await fundRepository().find();
    const dailyData = await dailyDataRepository().find();
    
    res.json({
      version: '1.0',
      exportDate: new Date().toISOString(),
      funds,
      dailyData
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

router.post('/import', async (req: Request, res: Response) => {
  try {
    const { funds, dailyData } = req.body;
    
    if (!funds || !Array.isArray(funds)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    let importedFunds = 0;
    let importedDailyData = 0;

    for (const fund of funds) {
      const existing = await fundRepository()
        .createQueryBuilder('f')
        .where('f.fundCode = :fundCode', { fundCode: fund.fundCode })
        .getOne();

      if (!existing) {
        const newFund = fundRepository().create({
          fundCode: fund.fundCode,
          fundName: fund.fundName,
          cost: fund.cost,
          shares: fund.shares,
          note: fund.note
        });
        await fundRepository().save(newFund);
        importedFunds++;
      }
    }

    if (dailyData && Array.isArray(dailyData)) {
      for (const data of dailyData) {
        const existing = await dailyDataRepository()
          .createQueryBuilder('d')
          .where('d.fundCode = :fundCode AND d.date = :date', { 
            fundCode: data.fundCode, 
            date: data.date 
          })
          .getOne();

        if (!existing) {
          const newDailyData = dailyDataRepository().create({
            fundCode: data.fundCode,
            nav: data.nav,
            dailyChange: data.dailyChange,
            date: data.date
          });
          await dailyDataRepository().save(newDailyData);
          importedDailyData++;
        }
      }
    }

    res.json({ 
      message: 'Import completed',
      importedFunds,
      importedDailyData
    });
  } catch (error) {
    console.error('Error importing data:', error);
    res.status(500).json({ error: 'Failed to import data' });
  }
});

export default router;
