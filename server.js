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

// Extract direct download URL from Google Drive link
const getDriveDownloadUrl = (link) => {
    const match = link.match(/(?:id=|\/d\/)([a-zA-Z0-9_-]{25,})/);
    if (!match) return null;
    // Use confirm=t to bypass the virus scan confirmation page
    return `https://drive.google.com/uc?export=download&confirm=t&id=${match[1]}`;
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

// Endpoint: Upload Player
app.post('/api/upload-player', async (req, res) => {
    const { name, skill, category = 'OPEN', photoUrl } = req.body;

    if (!name || !photoUrl) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        // Resolve Google Drive links if needed
        const finalUrl = photoUrl.includes('drive.google.com')
            ? getDriveDownloadUrl(photoUrl)
            : photoUrl;

        if (!finalUrl) {
            return res.status(400).json({ message: 'Invalid photo URL' });
        }

        const response = await fetch(finalUrl);
        if (!response.ok) throw new Error('Failed to download image');

        const buffer = await response.buffer();

        // Detect actual image type from file signature (magic bytes)
        // Do NOT trust response Content-Type — Google Drive often returns text/html or application/octet-stream
        const detected = detectImageType(buffer);
        if (!detected) {
            console.error(`Downloaded file for ${name} is not a recognized image format. First bytes:`, buffer.slice(0, 16).toString('hex'));
            return res.status(400).json({ message: 'Downloaded file is not a valid image. Google Drive may have returned an HTML page instead. Check that the file is shared publicly.' });
        }

        const { contentType, ext } = detected;
        const fileName = `${name.replace(/\s+/g, '_').toLowerCase()}${ext}`;
        const uploadInfo = await uploadToSupabase(buffer, fileName, contentType);

        // Get public URL
        const { data: publicData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);
        const imageUrl = publicData?.publicUrl || '';

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

// Start server
app.listen(PORT, () => {
    console.log(`?? Server is running at http://localhost:${PORT}`);
});