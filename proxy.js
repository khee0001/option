const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// ✅ 모든 도메인 허용 (CORS 문제 해결)
app.use(cors({ origin: '*' }));

// ✅ JSON 파싱 허용
app.use(express.json());

// ✅ Key Option API
app.get('/api/keyoption/:symbol', (req, res) => {
  const symbol = req.params.symbol?.toUpperCase();
  const results = [];
  const filePath = path.join(__dirname, 'data.csv'); // 반드시 Render zip에 포함되어야 함

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

// ✅ 기본 확인용 라우터
app.get('/', (req, res) => {
  res.send('✅ Render CSV API 서버가 정상 작동 중입니다.');
});

// ✅ 서버 시작
app.listen(port, () => {
  console.log(`✅ CSV Server Running at http://localhost:${port}`);
});
