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

// Build Google Drive image URLs.
// Keep the active approach simple: public Drive file -> backend -> Supabase Storage.
const getDriveDownloadUrls = (link) => {
    const fileId = getDriveFileId(link);
    if (!fileId) return [];

    return [
        // Primary endpoint for a publicly shared Drive image
        `https://lh3.googleusercontent.com/d/${fileId}=s2000`,
        // Normal fallback if the primary CDN URL is temporarily unavailable
        `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`,
    ];
};

/*
Experimental Drive download endpoints tried during troubleshooting.
They are intentionally disabled now because the root cause was the file
sharing permission, not the download logic.

`https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`
`https://drive.google.com/uc?export=download&confirm=t&id=${fileId}`
`https://drive.google.com/uc?id=${fileId}&export=view`
*/

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

// Endpoint: Resolve/reuse a player's existing Storage photo, or download and upload a fallback.
app.post('/api/upload-player', async (req, res) => {
    const { name: rawName, skill, category = 'OPEN', photoUrl = '', forceDownload = false } = req.body || {};
    const name = sanitizePlayerName(String(rawName || ''));
    const photoLink = String(photoUrl || '').trim();

    if (!name) {
        return res.status(400).json({ message: 'Missing player name' });
    }

    try {
        const storage = supabase.storage.from(BUCKET_NAME);
        const baseName = sanitizeFileName(name).replace(/\.jpg$/i, '');
        const escapedBaseName = baseName.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
        const matchingFilePattern = new RegExp('^' + escapedBaseName + '(?:_[^/]*)?\\.jpg$', 'i');

        const matchingFiles = [];
        const pageSize = 1000;
        for (let offset = 0; ; offset += pageSize) {
            const { data: files, error: listError } = await storage.list('', {
                limit: pageSize,
                offset,
                search: baseName,
            });
            if (listError) throw listError;

            const page = files || [];
            matchingFiles.push(...page.filter(file => matchingFilePattern.test(file.name)));
            if (page.length < pageSize) break;
        }

        if (!forceDownload && matchingFiles.length === 1) {
            const existingFileName = matchingFiles[0].name;
            const { data: publicData } = storage.getPublicUrl(existingFileName);
            const imageUrl = publicData?.publicUrl || '';
            if (!imageUrl) throw new Error('Could not generate public URL for ' + existingFileName);

            const { error: dbError } = await supabase.from('players').upsert([{
                name, skill, category, image_url: imageUrl,
            }]);
            if (dbError) throw dbError;

            console.log('♻️ [' + name + '] Reusing existing Storage image: ' + existingFileName);
            return res.json({
                message: 'Existing Storage image reused',
                image_url: imageUrl,
                source: 'storage',
                matchedFiles: matchingFiles.length,
            });
        }

        if (!photoLink) {
            const { error: dbError } = await supabase.from('players').upsert([{
                name, skill, category, image_url: null,
            }]);
            if (dbError) throw dbError;

            return res.json({
                message: 'No existing unambiguous image and no CSV photo link',
                image_url: '',
                source: 'missing',
                matchedFiles: matchingFiles.length,
            });
        }

        let buffer = null;
        let lastError = null;
        const urls = photoLink.includes('drive.google.com') ? getDriveDownloadUrls(photoLink) : [photoLink];

        for (const url of urls) {
            try {
                console.log('📥 [' + name + '] Downloading fallback photo from ' + url.substring(0, 100));
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 30000);
                let response;
                try {
                    response = await fetch(url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
                            'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                            'Referer': 'https://drive.google.com/',
                        },
                        redirect: 'follow',
                        signal: controller.signal,
                    });
                } finally {
                    clearTimeout(timeout);
                }

                if (!response.ok) {
                    lastError = 'HTTP ' + response.status;
                    continue;
                }

                const candidateBuffer = Buffer.from(await response.arrayBuffer());
                if (candidateBuffer.length < 12 || !detectImageType(candidateBuffer)) {
                    lastError = 'Downloaded response was not a recognized image';
                    continue;
                }

                buffer = candidateBuffer;
                break;
            } catch (downloadError) {
                lastError = downloadError.message;
            }
        }

        if (!buffer) {
            return res.status(400).json({
                message: ('Could not download image for ' + name + '. Ensure the Drive file is shared with anyone who has the link. ' + (lastError || '')).trim(),
            });
        }

        const detected = detectImageType(buffer);
        if (!detected) throw new Error('Downloaded file is not a supported image');

        const uniqueSuffix = Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        const fileName = baseName + '_' + uniqueSuffix + detected.ext;
        const { error: uploadError } = await storage.upload(fileName, buffer, {
            contentType: detected.contentType,
            cacheControl: '3600',
            upsert: false,
        });
        if (uploadError) throw uploadError;

        const { data: publicData } = storage.getPublicUrl(fileName);
        const imageUrl = publicData?.publicUrl || '';
        if (!imageUrl) throw new Error('Could not generate public URL for uploaded image');

        const { error: dbError } = await supabase.from('players').upsert([{
            name, skill, category, image_url: imageUrl,
        }]);
        if (dbError) throw dbError;

        console.log('✅ [' + name + '] Uploaded fallback image to Storage: ' + fileName);
        return res.json({
            message: 'Fallback image downloaded and uploaded',
            image_url: imageUrl,
            source: 'drive',
            matchedFiles: matchingFiles.length,
            storageFile: fileName,
        });
    } catch (err) {
        console.error('Error processing photo for ' + name + ':', err.message);
        return res.status(500).json({ message: 'Player photo processing failed', error: err.message });
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