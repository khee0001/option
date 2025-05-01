const express = require('express');
const app = express();
const port = process.env.PORT || 3000; // Render의 동적 포트 지원
const cors = require('cors');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

app.use(cors()); // 모든 라우트에 CORS 활성화
app.use(express.json());

// ===== NASDAQ 옵션 체인 데이터 가져오기 (MaxPain용) =====
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
            timeout: 10000, // 10초 타임아웃 설정
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Nasdaq 옵션 체인 오류:', error);
        res.status(500).json({ error: 'Nasdaq 옵션 체인 데이터 가져오기 실패. API 차단 가능성 있음.' });
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
            timeout: 10000,
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Nasdaq 정보 오류:', error);
        res.status(500).json({ error: 'Nasdaq 정보 데이터 가져오기 실패. API 차단 가능성 있음.' });
    }
});

// ===== [신규] NASDAQ 옵션 체인 데이터 프록시 =====
app.get('/api/proxy/option-chain', async (req, res) => {
    const symbol = req.query.symbol?.toUpperCase() || 'TSLA';
    const assetclass = req.query.assetclass || 'stocks';

    try {
        const response = await fetch(`https://api.nasdaq.com/api/quote/${symbol}/option-chain?assetclass=${assetclass}&limit=180`, {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                'Origin': 'https://www.nasdaq.com',
                'Referer': 'https://www.nasdaq.com/',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            timeout: 10000,
        });
        const data = await response.json();
        res.json({ data });
    } catch (error) {
        console.error('Nasdaq 프록시 오류:', error);
        res.status(502).json({ error: 'Nasdaq 옵션 체인 데이터 가져오기 실패. API 차단 가능성 있음.' });
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