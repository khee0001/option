
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

app.get('/api/quote/:symbol/option-chain', async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const assetclass = req.query.assetclass || 'stocks';

    try {
        const response = await fetch(`https://api.nasdaq.com/api/quote/${symbol}/option-chain?assetclass=${assetclass}&limit=180`, {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0',
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

app.get('/api/quote/:symbol/info', async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const assetclass = req.query.assetclass || 'stocks';

    try {
        const response = await fetch(`https://api.nasdaq.com/api/quote/${symbol}/info?assetclass=${assetclass}`, {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0',
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

app.get('/api/keyoption/:symbol', async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const results = [];

    const filePath = path.join(__dirname, 'data.csv');

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

app.listen(port, () => {
    console.log(`✅ Server is running: http://localhost:${port}`);
});
