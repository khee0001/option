const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// ✅ CORS 설정
app.use(cors({
  origin: 'https://userid-2fccf.web.app',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.options('*', cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://userid-2fccf.web.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(express.json());

// ✅ Key Option API
app.get('/api/keyoption/:symbol', (req, res) => {
  const symbol = req.params.symbol?.toUpperCase();
  const results = [];
  const filePath = path.join(__dirname, 'data.csv');

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol 파라미터 누락' });
  }

  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'CSV 파일이 존재하지 않습니다.' });
    }

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        if (row.Symbol && row.Symbol.toUpperCase() === symbol) {
          results.push(row);
        }
      })
      .on('end', () => {
        res.json({ data: results });
      })
      .on('error', (err) => {
        console.error('CSV 파싱 오류:', err);
        res.status(500).json({ error: 'CSV 파싱 중 오류 발생' });
      });
  } catch (err) {
    console.error('CSV 읽기 오류:', err);
    res.status(500).json({ error: 'CSV 파일 처리 중 예외 발생' });
  }
});

// ✅ NASDAQ 옵션 체인 프록시 (MaxPain용)
app.get('/api/quote/:symbol/option-chain', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const assetclass = req.query.assetclass || 'stocks';

  try {
    const response = await fetch(`https://api.nasdaq.com/api/quote/${symbol}/option-chain?assetclass=${assetclass}&limit=180`, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Origin': 'https://www.nasdaq.com',
        'Referer': 'https://www.nasdaq.com/'
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'NASDAQ 옵션 데이터를 가져오는 중 오류 발생' });
  }
});

// ✅ NASDAQ 현재가 프록시 (info)
app.get('/api/quote/:symbol/info', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const assetclass = req.query.assetclass || 'stocks';

  try {
    const response = await fetch(`https://api.nasdaq.com/api/quote/${symbol}/info?assetclass=${assetclass}`, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Origin': 'https://www.nasdaq.com',
        'Referer': 'https://www.nasdaq.com/'
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'NASDAQ 현재가 데이터를 가져오는 중 오류 발생' });
  }
});

// 기본 라우트
app.get('/', (req, res) => {
  res.send('✅ Render CSV + NASDAQ Proxy API 서버 작동 중');
});

app.listen(port, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${port}`);
});
