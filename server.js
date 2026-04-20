/**
 * EPS → SVG Converter Microservice
 * Converts EPS files to SVG using Ghostscript.
 * SVG output = vector, infinitely scalable, editable colors.
 * Designed to run on Render.com free tier.
 *
 * POST /convert
 *   Body: multipart/form-data with field "file" (the EPS file)
 *   Query: ?format=svg (default) or ?format=png (fallback)
 *   Returns: SVG (image/svg+xml) or PNG (image/png)
 */
const express = require('express');
const multer = require('multer');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB max
});

// CORS — allow requests from any origin (GitHub Pages, custom domain, localhost)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'eps-converter', formats: ['svg', 'png'] });
});

// Convert EPS → SVG (default) or PNG (fallback)
app.post('/convert', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Send a multipart/form-data POST with field "file".' });
  }

  const format = (req.query.format || 'svg').toLowerCase();
  const id = crypto.randomBytes(8).toString('hex');
  const tmpDir = os.tmpdir();
  const inputPath = path.join(tmpDir, `${id}.eps`);
  const ext = format === 'png' ? 'png' : 'svg';
  const outputPath = path.join(tmpDir, `${id}.${ext}`);

  try {
    fs.writeFileSync(inputPath, req.file.buffer);

    if (format === 'png') {
      // Direct EPS → PNG via Ghostscript
      await new Promise((resolve, reject) => {
        execFile('gs', [
          '-sDEVICE=png16malpha',
          '-r300',
          '-dEPSCrop',
          '-dBATCH', '-dNOPAUSE', '-dNOSAFER',
          '-dTextAlphaBits=4',
          '-dGraphicsAlphaBits=4',
          `-sOutputFile=${outputPath}`,
          inputPath
        ], { timeout: 30000 }, (err, stdout, stderr) => {
          if (err) reject(new Error(stderr || err.message));
          else resolve();
        });
      });
    } else {
      // EPS → PDF → SVG (two-step, most reliable)
      const pdfPath = path.join(tmpDir, `${id}.pdf`);
      try {
        // Step 1: EPS → PDF via Ghostscript
        await new Promise((resolve, reject) => {
          execFile('gs', [
            '-sDEVICE=pdfwrite',
            '-dEPSCrop',
            '-dBATCH', '-dNOPAUSE', '-dNOSAFER',
            '-dCompatibilityLevel=1.5',
            `-sOutputFile=${pdfPath}`,
            inputPath
          ], { timeout: 30000 }, (err, stdout, stderr) => {
            if (err) reject(new Error(stderr || err.message));
            else resolve();
          });
        });
        // Step 2: PDF → SVG via pdf2svg
        await new Promise((resolve, reject) => {
          execFile('pdf2svg', [pdfPath, outputPath], { timeout: 15000 }, (err, stdout, stderr) => {
            if (err) reject(new Error(stderr || err.message));
            else resolve();
          });
        });
      } finally {
        try { fs.unlinkSync(pdfPath); } catch (e) {}
      }
    }

    if (!fs.existsSync(outputPath)) {
      return res.status(500).json({ error: 'Ghostscript produced no output.' });
    }

    const output = fs.readFileSync(outputPath);
    const contentType = format === 'png' ? 'image/png' : 'image/svg+xml';
    res.set('Content-Type', contentType);
    res.set('Content-Length', output.length);
    res.send(output);

  } catch (err) {
    console.error('Conversion failed:', err.message);
    res.status(500).json({ error: 'Conversion failed: ' + err.message });
  } finally {
    try { fs.unlinkSync(inputPath); } catch (e) {}
    try { fs.unlinkSync(outputPath); } catch (e) {}
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`EPS converter running on port ${PORT}`);
});
