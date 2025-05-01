import express from 'express';
import cors from 'cors';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import AbortController from 'abort-controller';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000; // Render의 동적 포트 지원

// 요청 로깅 미들웨어
app.use((req, res, next) => {
    console.log(new Date().toISOString(), req.method, req.originalUrl);
    next();
});

app.use(cors()); // 모든 라우트에 CORS 활성화
app.use(express.json());

// ===== NASDAQ 옵션 체인 데이터 가져오기 (MaxPain용) =====
app.get('/api/quote/:symbol/option-chain', async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const assetclass = req.query.assetclass || 'stocks';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃

    try {
        const response = await fetch(`https://api.nasdaq.com/api/quote/${symbol}/option-chain?assetclass=${assetclass}&limit=180`, {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                'Origin': 'https://www.nasdaq.com',
                'Referer': 'https://www.nasdaq.com/',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`Upstream status ${response.status}`);
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        clearTimeout(timeout);
        console.error('Nasdaq 옵션 체인 오류:', error.message);
        res.status(502).json({ error: 'Nasdaq 옵션 체인 데이터 가져오기 실패. API 차단 가능성 있음.' });
    }
});

// ===== NASDAQ 가격 데이터 가져오기 (현재가/변동률용) =====
app.get('/api/quote/:symbol/info', async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const params = new URLSearchParams(req.query).toString();
    const url = `https://api.nasdaq.com/api/quote/${symbol}/info?${params}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                'Origin': 'https://www.nasdaq.com',
                'Referer': 'https://www.nasdaq.com/',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`Upstream status ${response.status}`);
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        clearTimeout(timeout);
        console.error('Nasdaq 정보 오류:', error.message);
        res.status(502).json({ error: 'Nasdaq 정보 데이터 가져오기 실패. API 차단 가능성 있음.' });
    }
});

// ===== [신규] NASDAQ 옵션 체인 데이터 프록시 =====
app.get('/api/proxy/option-chain', async (req, res) => {
    const symbol = req.query.symbol?.toUpperCase() || 'TSLA';
    const params = new URLSearchParams(req.query).toString();
    const url = `https://api.nasdaq.com/api/quote/${symbol}/option-chain?${params}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                'Origin': 'https://www.nasdaq.com',
                'Referer': 'https://www.nasdaq.com/',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`Upstream status ${response.status}`);
        }
        const data = await response.json();
        res.json({ data });
    } catch (error) {
        clearTimeout(timeout);
        console.error('Nasdaq 프록시 오류:', error.message);
        res.status(502).json({ error: 'Nasdaq 옵션 체인 데이터 가져오기 실패. API 차단 가능성 있음.' });
    }
});

// ===== 키 옵션 데이터 검색 =====
app.get('/api/keyoption/:symbol', async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const results = [];

    const filePath = path.join(__dirname, 'data.csv');

    try {
        if (!fs.existsSync(filePath)) {
            return res.status(500).json({ error: '서버에서 CSV 파일을 찾을 수 없습니다.' });
        }

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                try {
                    if (data.Symbol && data.Symbol.toUpperCase() === symbol) {
                        results.push(data);
                    }
                } catch (err) {
                    console.error('행 파싱 오류:', err);
                }
            })
            .on('end', () => {
                if (results.length === 0) {
                    res.status(404).json({ error: `심볼에 대한 데이터 없음: ${symbol}` });
                } else {
                    res.json({ data: results });
                }
            })
            .on('error', (err) => {
                console.error('CSV 파싱 오류:', err);
                res.status(500).json({ error: 'CSV 파싱 실패' });
            });
    } catch (err) {
        console.error('파일 스트림 오류:', err);
        res.status(500).json({ error: 'CSV 파일 처리 실패' });
    }
});

// ===== 루트 엔드포인트 =====
app.get('/', (req, res) => {
    res.send('✅ Option API Server is Running.');
});

// ===== 서버 실행 =====
app.listen(port, () => {
    console.log(`✅ 서버 실행 중: http://localhost:${port}`);
});