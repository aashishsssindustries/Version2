import yahooFinance from 'yahoo-finance2';

async function debugQuote() {
    const symbol = 'RELIANCE.NS';
    console.log(`Fetching quote for: ${symbol}`);
    try {
        const result = await yahooFinance.quote(symbol);
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (e: any) {
        console.error('Full Error Object:', e);
        if (e.message) console.error('Error Message:', e.message);
        if (e.name) console.error('Error Name:', e.name);
        if (e.stack) console.error('Error Stack:', e.stack);
    }

    console.log('\nFetching quote for AAPL (test)...');
    try {
        const result: any = await yahooFinance.quote('AAPL');
        console.log('AAPL Result:', result.symbol, result.regularMarketPrice);
    } catch (e: any) {
        console.error('AAPL Error:', e.message);
    }
}

debugQuote();
