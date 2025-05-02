const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// CORS 설정
app.use(cors({
  origin: 'https://userid-2fccf.web.app',
  methods: ['GET', 'POST', 'OPTIONS'], // OPTIONS 메서드 추가
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 모든 경로에 대해 OPTIONS 요청 처리
app.options('*', cors());

// 수동으로 CORS 헤더 추가
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://userid-2fccf.web.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// JSON 파싱 허용
app.use(express.json());

// Key Option API
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

// 기본 확인용 라우터
app.get('/', (req, res) => {
  res.send('✅ Render CSV API 서버가 정상 작동 중입니다.');
});

// 서버 시작
app.listen(port, () => {
  console.log(`✅ CSV Server Running at http://localhost:${port}`);
});