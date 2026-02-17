import axios from 'axios';

export interface FundQuote {
  fundCode: string;
  fundName: string;
  nav: number;
  dailyChange: number;
  date: string;
}

export async function getFundQuote(fundCode: string): Promise<FundQuote | null> {
  try {
    const url = `https://fundgz.1234567.com.cn/js/${fundCode}.js`;
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    const data = response.data;
    const jsonMatch = data.match(/jsonpgz\((.+)\)/);
    
    if (!jsonMatch) {
      return null;
    }

    const fundData = JSON.parse(jsonMatch[1]);
    
    return {
      fundCode: fundData.fundcode || fundCode,
      fundName: fundData.name || '',
      nav: parseFloat(fundData.dwjz) || 0,
      dailyChange: parseFloat(fundData.gszzl) || 0,
      date: fundData.gztime?.split(' ')[0] || new Date().toISOString().split('T')[0]
    };
  } catch (error) {
    console.error(`Failed to fetch fund ${fundCode}:`, (error as any)?.message);
    return null;
  }
}

export async function getFundQuotes(fundCodes: string[]): Promise<FundQuote[]> {
  const results: FundQuote[] = [];
  for (const code of fundCodes) {
    const quote = await getFundQuote(code);
    if (quote) {
      results.push(quote);
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  return results;
}
