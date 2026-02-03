import yahooFinance from 'yahoo-finance2';

async function debugSearch() {
    const isin = 'INE002A01018';
    console.log(`Searching for ISIN: ${isin}`);
    try {
        const result = await yahooFinance.search(isin);
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (e: any) {
        console.error('Error:', e);
        if (e.errors) {
            console.error('Validation Errors:', JSON.stringify(e.errors, null, 2));
        }
    }
}

debugSearch();
