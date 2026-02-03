import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
import redisCache from '../config/redis';
import logger from '../config/logger';

export interface EquityPrice {
    symbol: string;
    price: number;
    currency: string;
    change: number;
    changePercent: number;
    lastUpdated: Date;
    name?: string;
}

export class EquityService {
    // Cache TTL
    private static readonly PRICE_TTL = 900; // 15 minutes
    private static readonly ISIN_MAP_TTL = 86400 * 30; // 30 days (ISIN mapping rarely changes)
    private static readonly CACHE_PREFIX = 'equity:';

    // Fallback Map for common ISINs (since Yahoo search is unreliable for ISINs)
    private static readonly ISIN_TICKER_MAP: Record<string, string> = {
        'INE002A01018': 'RELIANCE.NS',  // Reliance Industries
        'INE040A01034': 'HDFCBANK.NS',  // HDFC Bank
        'INE009A01021': 'INFY.NS',      // Infosys
        'INE081A01012': 'TATASTEEL.NS', // Tata Steel
    };

    /**
     * Get live quote for an equity by ISIN
     * 1. Resolves ISIN to Ticker (checks cache first)
     * 2. Fetches price for Ticker (checks cache first)
     */
    static async getQuoteByISIN(isin: string): Promise<EquityPrice | null> {
        try {
            // Step 1: Resolve ISIN to Ticker
            const ticker = await this.resolveISINToTicker(isin);

            if (!ticker) {
                logger.warn(`Could not resolve ISIN to Ticker: ${isin}`);
                return null;
            }

            // Step 2: Get Price for Ticker
            return await this.getQuoteByTicker(ticker);

        } catch (error: any) {
            logger.error(`Error fetching equity quote for ISIN ${isin}:`, error.message);
            return null;
        }
    }

    /**
     * Get live quote for a ticker symbol (e.g. RELIANCE.NS)
     */
    static async getQuoteByTicker(ticker: string): Promise<EquityPrice | null> {
        const cacheKey = `${this.CACHE_PREFIX}price:${ticker}`;

        // Check Cache
        try {
            const cached = await redisCache.get(cacheKey);
            if (cached) {
                const data = JSON.parse(cached);
                return { ...data, lastUpdated: new Date(data.lastUpdated) };
            }
        } catch (err: any) {
            logger.warn(`Redis read error: ${err.message}`);
        }

        // Fetch from Yahoo Finance
        try {
            // suppressErrors: true to handle missing symbols gracefully
            const quote: any = await yahooFinance.quote(ticker);

            if (!quote || !quote.regularMarketPrice) {
                return null;
            }

            const equityPrice: EquityPrice = {
                symbol: quote.symbol,
                price: quote.regularMarketPrice,
                currency: quote.currency || 'INR',
                change: quote.regularMarketChange || 0,
                changePercent: quote.regularMarketChangePercent || 0,
                lastUpdated: new Date(),
                name: quote.longName || quote.shortName
            };

            // Cache Result
            await redisCache.set(cacheKey, JSON.stringify(equityPrice), this.PRICE_TTL);

            return equityPrice;

        } catch (error: any) {
            logger.error(`Yahoo Finance API error for ${ticker}:`, error.message);
            return null;
        }
    }

    /**
     * Resolves an ISIN (e.g., INE002A01018) to a Yahoo Ticker (e.g., RELIANCE.NS)
     */
    private static async resolveISINToTicker(isin: string): Promise<string | null> {
        const cacheKey = `${this.CACHE_PREFIX}isin_map:${isin}`;

        // Check Cache
        try {
            const cached = await redisCache.get(cacheKey);
            if (cached) return cached;
        } catch (err) { }

        // Step 1: Check Static Map (Fastest & Most Reliable for known stocks)
        if (this.ISIN_TICKER_MAP[isin]) {
            const ticker = this.ISIN_TICKER_MAP[isin];
            logger.debug(`Resolved ISIN ${isin} to ${ticker} via static map`);
            return ticker;
        }

        try {
            // Use Yahoo Finance search to find the ISIN
            // ISIN search often returns the symbol. 
            // We verify it's an Indian stock (.NS or .BO)
            const searchResult: any = await yahooFinance.search(isin);

            if (searchResult.quotes && searchResult.quotes.length > 0) {
                // Prefer NSE (.NS) over BSE (.BO) if available
                const nseQuote = searchResult.quotes.find((q: any) => q.symbol.endsWith('.NS'));
                const bseQuote = searchResult.quotes.find((q: any) => q.symbol.endsWith('.BO'));
                const bestQuote = nseQuote || bseQuote || searchResult.quotes[0];

                if (bestQuote && bestQuote.symbol) {
                    const ticker = bestQuote.symbol;

                    // Cache the mapping
                    await redisCache.set(cacheKey, ticker, this.ISIN_MAP_TTL);
                    return ticker;
                }
            }

            logger.warn(`No ticker found for ISIN via search: ${isin}`);
            return null;

        } catch (error: any) {
            logger.error(`Error resolving ISIN ${isin}:`, error.message);
            return null;
        }
    }
}
