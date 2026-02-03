import { EquityService } from '../src/services/equity.service';
import 'dotenv/config'; // Load .env file

// Mock config and redis if needed, but since we are running in ts-node context inside backend, 
// the imports in equity.service.ts should resolve correctly if configured properly.

async function testYahooFinance() {
    console.log('Testing Yahoo Finance Integration...');

    try {
        // Ensure Redis is connected (if your service relies on it being ready)
        // Adjust based on your redis config implementation

        const isins = [
            'INE002A01018', // Reliance Industries
            'INE040A01034', // HDFC Bank
            'INE009A01021', // Infosys
        ];

        for (const isin of isins) {
            console.log(`\nFetching quote for ISIN: ${isin}`);
            const quote = await EquityService.getQuoteByISIN(isin);

            if (quote) {
                console.log('✅ Success:');
                console.log(`   Symbol: ${quote.symbol}`);
                console.log(`   Name: ${quote.name}`);
                console.log(`   Price: ₹${quote.price}`);
                console.log(`   Change: ${quote.change} (${quote.changePercent.toFixed(2)}%)`);
                console.log(`   Last Updated: ${quote.lastUpdated}`);
            } else {
                console.log('❌ Failed to fetch quote');
            }
        }

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        process.exit(0);
    }
}

testYahooFinance();
