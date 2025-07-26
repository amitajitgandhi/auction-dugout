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
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET_NAME = process.env.REACT_APP_SUPABASE_BUCKET_NAME || 'player-images';
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
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
};

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

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const ext = contentType.includes('png') ? '.png' : '.jpg';
        const buffer = await response.buffer();

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

        res.json({ message: 'Uploaded successfully', image_url: imageUrl });
    } catch (err) {
        console.error(`Error uploading ${name}:`, err.message);
        res.status(500).json({ message: 'Upload failed', error: err.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`?? Server is running at http://localhost:${PORT}`);
});