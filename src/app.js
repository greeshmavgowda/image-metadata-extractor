require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { exiftool } = require('exiftool-vendored');
const fs = require('fs').promises;
const path = require('path');

const app = express();

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Create uploads folder path
const uploadDir = path.join(__dirname, 'uploads');

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ storage });

// Health endpoint
app.get('/health', (req, res) => res.json({ status: 'UP' }));

// Metadata extraction endpoint
app.post('/api/extract', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file is required (field name: file)' });

  const filePath = req.file.path;

  try {
    const metadata = await exiftool.read(filePath);
    const cleaned = {};

    for (const [k, v] of Object.entries(metadata)) {
      if (k !== 'SourceFile') cleaned[k] = v;
    }

    res.json({ metadata: cleaned });
  } catch (err) {
    console.error('Metadata extraction error:', err);
    res.status(500).json({ error: 'Failed to extract metadata' });
  } finally {
    // Delete file after processing
    try {
      await fs.unlink(filePath);
    } catch (cleanupError) {
      console.warn('Failed to remove uploaded file:', cleanupError);
    }
  }
});

// Server start
if (require.main === module) {
  fs.mkdir(uploadDir, { recursive: true }).then(() => {
    const PORT = process.env.PORT || 8081;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  });
}

module.exports = app;

