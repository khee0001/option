import express from 'express';
import cors from 'cors';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

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

    const filePath = path.join(__dirname, 'data.csv');

    try {
        if (!fs.existsSync(filePath)) {
            return res.status(500).json({ error: 'CSV file not found on server' });
        }

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                try {
                    if (data.Symbol && data.Symbol.toUpperCase() === symbol) {
                        results.push(data);
                    }
                } catch (err) {
                    console.error('Row parsing error:', err);
                }
            })
            .on('end', () => {
                if (results.length === 0) {
                    res.status(404).json({ error: `No data found for symbol: ${symbol}` });
                } else {
                    res.json({ data: results });
                }
            })
            .on('error', (err) => {
                console.error('CSV parsing error:', err);
                res.status(500).json({ error: 'CSV parsing failed' });
            });

    } catch (err) {
        console.error('File stream error:', err);
        res.status(500).json({ error: 'Failed to process CSV file' });
    }
});

// ===== HTML 파일을 제공하는 경로 설정 =====
// ✅ 대신 아래처럼 텍스트 응답으로 처리하세요
app.get('/', (req, res) => {
    res.send('✅ Option API Server is Running.');
  });

// ===== 서버 실행 =====
app.listen(port, () => {
    console.log(`✅ Server is running: http://localhost:${port}`);
});