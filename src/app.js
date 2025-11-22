require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { exiftool } = require('exiftool-vendored');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(__dirname + '/public'));

const uploadDir = path.resolve(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

app.get('/health', (req, res) => res.json({ status: 'UP' }));

app.post('/api/extract', upload.single('file'), async (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: 'file is required (field name: file)' });

  const filepath = req.file.path;

  try {
    const metadata = await exiftool.read(filepath);
    const cleaned = {};

    for (const [k, v] of Object.entries(metadata)) {
      if (k === 'SourceFile') continue;
      cleaned[k] = v;
    }

    res.json({ metadata: cleaned });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to extract metadata' });
  } finally {
    try {
      await fs.unlink(filepath);
    } catch {}
  }
});

if (require.main === module) {
  fs.mkdir(uploadDir, { recursive: true }).then(() => {
    const PORT = process.env.PORT || 8081;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  });
}

module.exports = app;
