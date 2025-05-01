const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

app.use(cors());
app.use(express.json());

// === Key Option Data 검색 (CSV 파일 기반)
app.get('/api/keyoption/:symbol', (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const results = [];
  const filePath = path.join(__dirname, 'data.csv'); // 🔁 반드시 Render 배포 폴더에 포함

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
    res.status(500).json({ error: 'CSV 파일 읽기 실패' });
  }
});

// 기본 라우터 (선택 사항)
app.get('/', (req, res) => {
  res.send('✅ CSV API 서버 작동 중');
});

app.listen(port, () => {
  console.log(`✅ CSV Server Running at http://localhost:${port}`);
});
