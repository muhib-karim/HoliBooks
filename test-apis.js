/**
 * HoliBooks - API Test Script
 * Run with: node test-apis.js
 * Tests all API endpoints used by the application
 */

const https = require('https');

const APIS = [
    { name: 'Quran API (AlQuran Cloud)', url: 'https://api.alquran.cloud/v1/surah/1' },
    { name: 'Bible API (JSDelivr)', url: 'https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/en-kjv/books/genesis/chapters/1.json' },
    { name: 'Bhagavad Gita API', url: 'https://vedicscriptures.github.io/slok/1/1' },
    { name: 'GurbaniNow API', url: 'https://api.gurbaninow.com/v2/ang/1' }
];

async function testAPI(api) {
    return new Promise((resolve) => {
        const startTime = Date.now();

        https.get(api.url, (res) => {
            const duration = Date.now() - startTime;
            let data = '';

            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const success = res.statusCode === 200;
                resolve({
                    name: api.name,
                    status: success ? '✅ OK' : `❌ ${res.statusCode}`,
                    time: `${duration}ms`,
                    hasData: data.length > 0
                });
            });
        }).on('error', (err) => {
            resolve({
                name: api.name,
                status: `❌ Error`,
                error: err.message
            });
        });
    });
}

async function runTests() {
    console.log('');
    console.log('  📖 HoliBooks API Test');
    console.log('  ─────────────────────');
    console.log('');

    for (const api of APIS) {
        const result = await testAPI(api);
        console.log(`  ${result.status} ${result.name}`);
        if (result.time) console.log(`     ⏱️  ${result.time}`);
        if (result.error) console.log(`     ⚠️  ${result.error}`);
    }

    console.log('');
    console.log('  Note: APIs may be blocked by CORS when opened');
    console.log('  from file://. Use serve.js for proper testing.');
    console.log('');
}

runTests();
