const express = require('express');
const app = express();
const port = 3000;
const cors = require('cors');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

app.use(cors());
app.use(express.json());

// ===== NASDAQ Option Chain 데이터 가져오기 (MaxPain용) =====
app.get('/api/quote/:symbol/option-chain', async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const assetclass = req.query.assetclass || 'stocks';

    try {
        const response = await fetch(`https://api.nasdaq.com/api/quote/${symbol}/option-chain?assetclass=${assetclass}&limit=180`, {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                'Origin': 'https://www.nasdaq.com',
                'Referer': 'https://www.nasdaq.com/',
            },
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching Nasdaq option chain data.' });
    }
});

// ===== NASDAQ 가격 데이터 가져오기 (현재가/변동률용) =====
app.get('/api/quote/:symbol/info', async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const assetclass = req.query.assetclass || 'stocks';

    try {
        const response = await fetch(`https://api.nasdaq.com/api/quote/${symbol}/info?assetclass=${assetclass}`, {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                'Origin': 'https://www.nasdaq.com',
                'Referer': 'https://www.nasdaq.com/',
            },
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching Nasdaq info data.' });
    }
});

// ===== [추가] Key Option Data 검색 =====
app.get('/api/keyoption/:symbol', async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const results = [];

    const filePath = path.join('C:/Users/BodyWell/Desktop/Max app-봇2/data.csv');

    try {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                if (data.Symbol && data.Symbol.toUpperCase() === symbol) {
                    results.push(data);
                }
            })
            .on('end', () => {
                res.json({ data: results });
            });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to read CSV file.' });
    }
});

// ===== HTML 파일을 제공하는 경로 설정 =====
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ===== 서버 실행 =====
app.listen(port, () => {
    console.log(`✅ Server is running: http://localhost:${port}`);
});