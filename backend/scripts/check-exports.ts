const yahooFinanceRaw = require('yahoo-finance2');
console.log('Exports keys:', Object.keys(yahooFinanceRaw));
console.log('Type of exports:', typeof yahooFinanceRaw);
if (yahooFinanceRaw.YahooFinance) {
    console.log('YahooFinance class found');
}
if (yahooFinanceRaw.default) {
    console.log('Default export found type:', typeof yahooFinanceRaw.default);
}
