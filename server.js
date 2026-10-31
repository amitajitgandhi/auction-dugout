import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json({ limit: '10mb' })); // support large image URLs

// Supabase setup
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME || 'player-images';
const IMAGE_FOLDER = './player-images';

// Ensure temp folder exists
if (!fs.existsSync(IMAGE_FOLDER)) {
    fs.mkdirSync(IMAGE_FOLDER);
}

// For resolving file paths in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Extract Google Drive file ID from various link formats
const getDriveFileId = (link = '') => {
    const patterns = [
        /[?&]id=([a-zA-Z0-9_-]+)/,
        /\/file\/d\/([a-zA-Z0-9_-]+)/,
        /\/d\/([a-zA-Z0-9_-]+)/
    ];
    for (const pattern of patterns) {
        const match = link.match(pattern);
        if (match?.[1]) return match[1];
    }
    return null;
};

// Build multiple download URLs to try in order (most reliable first)
const getDriveDownloadUrls = (link) => {
    const fileId = getDriveFileId(link);
    if (!fileId) return [];
    return [
        // Google image CDN is the most likely to return actual image bytes for public Drive photos
        `https://lh3.googleusercontent.com/d/${fileId}=s2000`,
        // Drive thumbnail endpoint
        `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`,
        // Direct content download
        `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`,
        // Classic download endpoint
        `https://drive.google.com/uc?export=download&confirm=t&id=${fileId}`,
        // View endpoint fallback
        `https://drive.google.com/uc?id=${fileId}&export=view`,
    ];
};

// Legacy helper (still used in some places)
const getDriveDownloadUrl = (link) => {
    const urls = getDriveDownloadUrls(link);
    return urls.length > 0 ? urls[0] : null;
};

// Detect actual image type from buffer magic bytes (file signature)
// This is more reliable than trusting HTTP Content-Type headers
function detectImageType(buffer) {
    if (!buffer || buffer.length < 12) return null;

    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        return { contentType: 'image/jpeg', ext: '.jpg' };
    }
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        return { contentType: 'image/png', ext: '.png' };
    }
    // GIF: 47 49 46 38
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
        return { contentType: 'image/gif', ext: '.gif' };
    }
    // WebP: 52 49 46 46 ... 57 45 42 50
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
        return { contentType: 'image/webp', ext: '.webp' };
    }
    // BMP: 42 4D
    if (buffer[0] === 0x42 && buffer[1] === 0x4D) {
        return { contentType: 'image/bmp', ext: '.bmp' };
    }

    return null;
}

// Upload buffer to Supabase Storage
async function uploadToSupabase(buffer, fileName, contentType = 'image/jpeg') {
    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, buffer, {
            contentType,
            cacheControl: '3600',
            upsert: true,
        });

    if (error) throw error;
    return data;
}

// Sanitize a player name for use as a storage filename
// Strips non-ASCII chars (e.g. BOM artifacts, encoding garbage like \uFFFD)
const sanitizeFileName = (name) => {
    return name
        .replace(/[^\x20-\x7E]/g, '') // remove non-printable / non-ASCII characters
        .replace(/\s+/g, '_')          // spaces → underscores
        .replace(/[^a-zA-Z0-9_.-]/g, '') // keep only safe filename chars
        .toLowerCase();
};

// Sanitize a player name from CSV (remove invisible / control characters but keep readable text)
const sanitizePlayerName = (name) => {
    return name
        .replace(/[\u200B-\u200D\uFEFF\uFFFD]/g, '') // zero-width chars & replacement char
        .replace(/[^\x20-\x7E\u00C0-\u024F]/g, '')    // keep ASCII + accented Latin chars
        .trim();
};

// Endpoint: Upload Player
app.post('/api/upload-player', async (req, res) => {
    const { name: rawName, skill, category = 'OPEN', photoUrl } = req.body;
    const name = sanitizePlayerName(rawName || '');

    if (!name || !photoUrl) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        let buffer = null;
        let lastError = null;

        if (photoUrl.includes('drive.google.com')) {
            // Try multiple Google Drive download strategies
            const urls = getDriveDownloadUrls(photoUrl);
            for (const url of urls) {
                try {
                    console.log(`📥 [${name}] Trying: ${url.substring(0, 80)}...`);
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
                    const response = await fetch(url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                            'Accept-Language': 'en-US,en;q=0.9',
                            'Referer': 'https://drive.google.com/',
                        },
                        redirect: 'follow',
                        signal: controller.signal,
                    });
                    clearTimeout(timeout);

                    if (!response.ok) {
                        lastError = `HTTP ${response.status} from ${url.substring(0, 60)}`;
                        console.warn(`⚠️ [${name}] ${lastError}`);
                        continue;
                    }

                    const arrayBuffer = await response.arrayBuffer();
                    const candidateBuffer = Buffer.from(arrayBuffer);

                    // Validate: must be at least 1KB (error pages are usually tiny HTML snippets)
                    if (candidateBuffer.length < 1024) {
                        lastError = `Response too small (${candidateBuffer.length} bytes), likely not an image`;
                        console.warn(`⚠️ [${name}] ${lastError}`);
                        continue;
                    }

                    // Validate: must be a real image (magic bytes)
                    if (!detectImageType(candidateBuffer)) {
                        lastError = `Not a valid image from ${url} (content-type: ${response.headers.get('content-type') || 'unknown'}, first bytes: ${candidateBuffer.slice(0, 16).toString('hex')})`;
                        console.warn(`⚠️ [${name}] ${lastError}`);
                        continue;
                    }

                    buffer = candidateBuffer;
                    console.log(`✅ [${name}] Downloaded ${buffer.length} bytes from ${url.substring(0, 60)}`);
                    break;
                } catch (fetchErr) {
                    lastError = fetchErr.message;
                    console.warn(`⚠️ [${name}] Fetch failed: ${lastError}`);
                }
            }

            // Final Drive fallback: inspect the public preview page and extract its og:image URL.
            if (!buffer) {
                try {
                    console.log(`📥 [${name}] Trying Drive preview metadata fallback...`);
                    const preview = await fetch(photoUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
                            'Accept': 'text/html,application/xhtml+xml',
                        },
                        redirect: 'follow',
                    });
                    const html = await preview.text();
                    const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
                        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
                    if (match?.[1]) {
                        const imageUrl = match[1].replace(/\\u003d/g, '=').replace(/&amp;/g, '&');
                        console.log(`📥 [${name}] Trying og:image: ${imageUrl.substring(0, 100)}...`);
                        const imageResponse = await fetch(imageUrl, {
                            headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'image/*,*/*;q=0.8' },
                            redirect: 'follow',
                        });
                        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
                        if (imageResponse.ok && detectImageType(imageBuffer)) {
                            buffer = imageBuffer;
                            console.log(`✅ [${name}] Downloaded image via Drive preview metadata (${buffer.length} bytes)`);
                        } else {
                            lastError = `Drive preview og:image was not a valid image (status: ${imageResponse.status}, content-type: ${imageResponse.headers.get('content-type') || 'unknown'})`;
                        }
                    } else {
                        lastError = 'Drive preview page did not expose an og:image URL';
                    }
                } catch (previewErr) {
                    lastError = `Drive preview fallback failed: ${previewErr.message}`;
                }
            }
        } else {
            // Non-Drive URL — direct download
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
            const response = await fetch(photoUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                redirect: 'follow',
                signal: controller.signal,
            });
            clearTimeout(timeout);
            if (!response.ok) throw new Error(`Failed to download image: HTTP ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        }

        if (!buffer) {
            console.error(`❌ [${name}] All download attempts failed. Last error: ${lastError}`);
            return res.status(400).json({
                message: `Could not download image for ${name}. Ensure the Google Drive file is shared as "Anyone with the link". Last error: ${lastError}`,
            });
        }

        // Detect image type from magic bytes
        const detected = detectImageType(buffer);
        if (!detected) {
            console.error(`❌ [${name}] Downloaded file is not a recognized image. Size: ${buffer.length}, first bytes: ${buffer.slice(0, 16).toString('hex')}`);
            return res.status(400).json({ message: 'Downloaded file is not a valid image. Google Drive may have returned an HTML page instead. Check that the file is shared publicly.' });
        }

        const { contentType, ext } = detected;
        const fileName = `${sanitizeFileName(name)}${ext}`;
        const uploadInfo = await uploadToSupabase(buffer, fileName, contentType);

        // Get public URL
        const { data: publicData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);
        const imageUrl = publicData?.publicUrl || '';

        console.log(`✅ [${name}] Uploaded to Supabase: ${imageUrl} (${contentType}, ${buffer.length} bytes)`);

        // Save to Supabase DB
        await supabase.from('players').upsert([
            {
                name,
                skill,
                category,
                image_url: imageUrl,
            },
        ]);

        res.json({ message: 'Uploaded successfully', image_url: imageUrl, originalPhotoUrl: photoUrl });
    } catch (err) {
        console.error(`Error uploading ${name}:`, err.message);
        res.status(500).json({ message: 'Upload failed', error: err.message });
    }
});

// Endpoint: Fix existing images in Supabase Storage with correct Content-Type
// Re-downloads and re-uploads all images in the bucket with proper MIME types
app.post('/api/fix-storage-content-types', async (req, res) => {
    try {
        const { data: files, error: listError } = await supabase.storage
            .from(BUCKET_NAME)
            .list('', { limit: 1000 });

        if (listError) throw listError;

        const results = { fixed: 0, skipped: 0, failed: 0, details: [] };

        for (const file of files) {
            try {
                // Download the file from storage
                const { data: fileData, error: downloadError } = await supabase.storage
                    .from(BUCKET_NAME)
                    .download(file.name);

                if (downloadError) {
                    results.failed++;
                    results.details.push({ file: file.name, status: 'download_failed', error: downloadError.message });
                    continue;
                }

                const arrayBuffer = await fileData.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const detected = detectImageType(buffer);

                if (!detected) {
                    results.skipped++;
                    results.details.push({ file: file.name, status: 'not_image' });
                    continue;
                }

                // Re-upload with the correct content type
                const { error: uploadError } = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(file.name, buffer, {
                        contentType: detected.contentType,
                        cacheControl: '3600',
                        upsert: true,
                    });

                if (uploadError) {
                    results.failed++;
                    results.details.push({ file: file.name, status: 'upload_failed', error: uploadError.message });
                } else {
                    results.fixed++;
                    results.details.push({ file: file.name, status: 'fixed', contentType: detected.contentType });
                }
            } catch (fileErr) {
                results.failed++;
                results.details.push({ file: file.name, status: 'error', error: fileErr.message });
            }
        }

        console.log(`Storage fix complete: ${results.fixed} fixed, ${results.skipped} skipped, ${results.failed} failed`);
        res.json({ message: 'Storage content-type fix complete', ...results });
    } catch (err) {
        console.error('Fix storage error:', err.message);
        res.status(500).json({ message: 'Fix failed', error: err.message });
    }
});

// Endpoint: Diagnose bucket — check files, sizes, content types, and public URL accessibility
app.get('/api/health', async (req, res) => {
    res.json({
        ok: true,
        bucket: BUCKET_NAME,
        supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
    });
});

// Endpoint: Diagnose bucket — check files, sizes, content types, and public URL accessibility
app.get('/api/diagnose-bucket', async (req, res) => {
    try {
        const { data: files, error: listError } = await supabase.storage
            .from(BUCKET_NAME)
            .list('', { limit: 100 });

        if (listError) {
            return res.json({ status: 'error', message: 'Cannot list bucket files', error: listError.message });
        }

        const diagnosis = {
            bucket: BUCKET_NAME,
            totalFiles: files.length,
            files: [],
        };

        for (const file of files.slice(0, 10)) {  // Check first 10 files
            const fileInfo = { name: file.name, size: file.metadata?.size || 'unknown' };

            // Generate public URL
            const { data: publicData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(file.name);
            fileInfo.publicUrl = publicData?.publicUrl || 'N/A';

            // Download and check content
            try {
                const { data: fileData, error: dlError } = await supabase.storage.from(BUCKET_NAME).download(file.name);
                if (dlError) {
                    fileInfo.status = 'download_failed';
                    fileInfo.error = dlError.message;
                } else {
                    const ab = await fileData.arrayBuffer();
                    const buf = Buffer.from(ab);
                    fileInfo.actualSize = buf.length;
                    fileInfo.firstBytes = buf.slice(0, 8).toString('hex');
                    const detected = detectImageType(buf);
                    fileInfo.detectedType = detected ? detected.contentType : 'not_image';
                    fileInfo.isHtml = buf.slice(0, 15).toString('utf8').trim().startsWith('<');
                    fileInfo.status = detected ? 'valid_image' : (fileInfo.isHtml ? 'html_not_image' : 'unknown_format');
                }
            } catch (e) {
                fileInfo.status = 'check_error';
                fileInfo.error = e.message;
            }

            // Test public URL accessibility
            try {
                const pubRes = await fetch(fileInfo.publicUrl, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
                fileInfo.publicUrlStatus = pubRes.status;
                fileInfo.publicUrlContentType = pubRes.headers.get('content-type');
            } catch (e) {
                fileInfo.publicUrlStatus = 'unreachable';
            }

            diagnosis.files.push(fileInfo);
        }

        res.json(diagnosis);
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`?? Server is running at http://localhost:${PORT}`);
});