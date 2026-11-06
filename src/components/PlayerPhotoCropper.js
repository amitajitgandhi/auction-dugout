import React, { useEffect, useRef, useState } from 'react';

// Square crop editor with a circular preview matching the live auction player frame.
const PlayerPhotoCropper = ({ src, onCancel, onSave, saving = false }) => {
    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const [imageReady, setImageReady] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [horizontal, setHorizontal] = useState(50);
    const [vertical, setVertical] = useState(35);
    const [error, setError] = useState('');

    useEffect(() => {
        setImageReady(false);
        setError('');
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => {
            imageRef.current = image;
            setImageReady(true);
        };
        image.onerror = () => setError('This photo could not be opened for cropping. Try uploading the image again.');
        image.src = src;
        return () => { image.onload = null; image.onerror = null; };
    }, [src]);

    useEffect(() => {
        const image = imageRef.current;
        const canvas = canvasRef.current;
        if (!imageReady || !image || !canvas) return;
        const size = Math.min(image.naturalWidth, image.naturalHeight) / zoom;
        const left = (image.naturalWidth - size) * horizontal / 100;
        const top = (image.naturalHeight - size) * vertical / 100;
        canvas.width = 480;
        canvas.height = 480;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, 480, 480);
        context.drawImage(image, left, top, size, size, 0, 0, 480, 480);
    }, [imageReady, zoom, horizontal, vertical]);

    const saveCrop = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.toBlob(blob => {
            if (!blob) {
                setError('Could not prepare the cropped photo. Please try again.');
                return;
            }
            onSave(blob);
        }, 'image/jpeg', 0.92);
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 p-3">
            <section className="w-full max-w-md max-h-[94vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
                <h3 className="text-lg font-extrabold text-gray-900">✂️ Crop Player Photo</h3>
                <p className="mt-1 text-xs text-gray-500">Position the face inside the circular preview. The saved photo will be square.</p>
                <div className="mx-auto my-5 h-64 w-64 overflow-hidden rounded-full border-4 border-indigo-500 bg-gray-100 shadow-inner">
                    {imageReady ? <canvas ref={canvasRef} className="h-full w-full object-cover" /> : (
                        <div className="flex h-full items-center justify-center px-5 text-center text-sm text-gray-500">{error || 'Loading photo…'}</div>
                    )}
                </div>
                {imageReady && (
                    <div className="space-y-4">
                        <label className="block text-xs font-semibold text-gray-700">
                            Zoom <span className="float-right">{zoom.toFixed(1)}×</span>
                            <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={e => setZoom(Number(e.target.value))} className="mt-2 w-full accent-indigo-600" />
                        </label>
                        <label className="block text-xs font-semibold text-gray-700">
                            Horizontal position
                            <input type="range" min="0" max="100" value={horizontal} onChange={e => setHorizontal(Number(e.target.value))} className="mt-2 w-full accent-indigo-600" />
                        </label>
                        <label className="block text-xs font-semibold text-gray-700">
                            Vertical position
                            <input type="range" min="0" max="100" value={vertical} onChange={e => setVertical(Number(e.target.value))} className="mt-2 w-full accent-indigo-600" />
                        </label>
                    </div>
                )}
                {error && imageReady && <p className="mt-3 text-xs text-red-600">{error}</p>}
                <div className="mt-5 flex justify-end gap-2">
                    <button type="button" onClick={onCancel} disabled={saving} className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">Cancel</button>
                    <button type="button" onClick={saveCrop} disabled={!imageReady || saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save Cropped Photo'}</button>
                </div>
            </section>
        </div>
    );
};

export default PlayerPhotoCropper;
