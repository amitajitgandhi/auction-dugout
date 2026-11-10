import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getDefaultPlayerImage } from "../utils/constants";

const PlayerImage = ({ currentPlayer, imageKey, setImageKey }) => {
    const [imageLoadState, setImageLoadState] = useState('loading');
    const [useBackupIcon, setUseBackupIcon] = useState(false);
    const [urlAttempt, setUrlAttempt] = useState(0);
    const [showPhotoPreview, setShowPhotoPreview] = useState(false);
    const [photoZoom, setPhotoZoom] = useState(1);

    // Reset states for new player
    useEffect(() => {
        if (currentPlayer) {
            console.log('=== PLAYER IMAGE DEBUG ===');
            console.log('Current player:', currentPlayer.name);
            console.log('Player photo URL:', currentPlayer.photoUrl || currentPlayer.photo);
            
            setImageLoadState('loading');
            setUseBackupIcon(false);
            setUrlAttempt(0);
        }
    }, [currentPlayer]);

    const handleImageLoad = (e) => {
        console.log('?? Image loaded successfully for:', currentPlayer?.name);
        console.log('?? Image dimensions:', e.target.naturalWidth, 'x', e.target.naturalHeight);
        
        if (e.target.naturalWidth <= 1 || e.target.naturalHeight <= 1) {
            console.warn('?? Image loaded but has invalid dimensions, using backup icon');
            setUseBackupIcon(true);
            setImageLoadState('error');
        } else {
            setImageLoadState('loaded');
        }
    };

    const handlePlayerImageError = (e) => {
        console.error('? Player image failed for:', currentPlayer?.name);
        console.error('? Failed URL:', e.target.src);
        console.error('?? Attempt number:', urlAttempt + 1);
        
        if ((currentPlayer?.photoUrl || currentPlayer?.photo || '').includes('drive.google.com') && urlAttempt < 3) {
            console.log('?? Trying next URL format...');
            setUrlAttempt(prev => prev + 1);
            setImageKey(prev => prev + 1);
            return;
        }
        
        console.error('?? All URL formats failed, using backup icon');
        setImageLoadState('error');
        setUseBackupIcon(true);
    };

    const getPlayerImageUrl = () => {
        if (!(currentPlayer?.photoUrl || currentPlayer?.photo)) {
            return getDefaultPlayerImage();
        }
        return currentPlayer.photoUrl || currentPlayer.photo;
    };

    const getOriginalDriveLink = () => {
        const photoUrl = currentPlayer?.photoUrl || currentPlayer?.photo || '';
        if (photoUrl && photoUrl.includes('drive.google.com/thumbnail')) {
            const match = photoUrl.match(/id=([a-zA-Z0-9-_]+)/);
            if (match) {
                const fileId = match[1];
                return `https://drive.google.com/file/d/${fileId}/view`;
            }
        }
        return photoUrl;
    };

    const renderPlayerIcon = () => {
        return (
            <div style={{
                width: '100%',
                height: '100%',
                background: '#f3f4f6',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
            }}>
                <div style={{
                    width: '70px',
                    height: '70px',
                    backgroundColor: '#d1d5db',
                    borderRadius: '50%',
                    marginBottom: '20px'
                }}></div>
                
                <div style={{
                    width: '140px',
                    height: '100px',
                    backgroundColor: '#d1d5db',
                    borderRadius: '70px 70px 0 0',
                    position: 'relative'
                }}></div>
                
                <div style={{
                    position: 'absolute',
                    bottom: '40px',
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    color: '#6b7280',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 'normal',
                    fontFamily: 'Arial, sans-serif'
                }}>
                    No Image
                </div>
            </div>
        );
    };

    return (
        <div className={`w-80 h-80 rounded-full border-4 shadow-lg ml-6 transition-all duration-300 relative ${
            currentPlayer && currentPlayer.sold && currentPlayer.soldTo !== 'Unsold' ? 'border-green-400 shadow-green-300/50' : 
            currentPlayer && currentPlayer.soldTo === 'Unsold' ? 'border-red-400 shadow-red-300/50' : 
            'border-yellow-400'
        }`} style={{ overflow: 'hidden' }}>
            {useBackupIcon ? (
                renderPlayerIcon()
            ) : (
                <>
                    <button
                        type="button"
                        onClick={() => { setPhotoZoom(1); setShowPhotoPreview(true); }}
                        aria-label={`Enlarge photo of ${currentPlayer?.name || 'player'}`}
                        style={{ display: 'block', width: '100%', height: '100%', cursor: 'zoom-in' }}
                    >
                        <img
                            key={imageKey}
                            src={getPlayerImageUrl()}
                            alt={currentPlayer?.name || 'Player'}
                            className="w-full h-full object-cover"
                            onError={handlePlayerImageError}
                            onLoad={handleImageLoad}
                            style={{ display: imageLoadState === 'error' ? 'none' : 'block', width: '100%', height: '100%' }}
                        />
                    </button>
                    {showPhotoPreview && createPortal(
                        <div
                            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 p-4"
                            onClick={() => setShowPhotoPreview(false)}
                            onWheel={(event) => {
                                event.preventDefault();
                                setPhotoZoom(current => Math.min(3, Math.max(1, current + (event.deltaY < 0 ? 0.2 : -0.2))));
                            }}
                            role="presentation"
                        >
                            <section
                                className="relative flex max-h-[90vh] max-w-[95vw] flex-col items-center"
                                role="dialog"
                                aria-modal="true"
                                aria-label={`${currentPlayer?.name || 'Player'} photo`}
                                onClick={event => event.stopPropagation()}
                            >
                                <div className="mb-3 flex items-center gap-3 rounded-full bg-white/10 px-3 py-2 text-white">
                                    <button type="button" onClick={() => setPhotoZoom(current => Math.max(1, +(current - 0.2).toFixed(1)))} disabled={photoZoom <= 1} className="h-9 w-9 rounded-full bg-white/20 text-2xl disabled:opacity-40" aria-label="Zoom out">−</button>
                                    <span className="min-w-14 text-center text-sm">{Math.round(photoZoom * 100)}%</span>
                                    <button type="button" onClick={() => setPhotoZoom(current => Math.min(3, +(current + 0.2).toFixed(1)))} disabled={photoZoom >= 3} className="h-9 w-9 rounded-full bg-white/20 text-2xl disabled:opacity-40" aria-label="Zoom in">+</button>
                                    <button type="button" onClick={() => setPhotoZoom(1)} className="ml-1 rounded-full bg-white/20 px-3 py-2 text-sm">Reset</button>
                                    <button type="button" onClick={() => setShowPhotoPreview(false)} className="ml-2 rounded-full bg-white px-3 py-2 text-lg font-bold text-gray-800" aria-label="Close photo">✕</button>
                                </div>
                                <div className="max-h-[80vh] max-w-[95vw] overflow-auto">
                                    <img
                                        src={getPlayerImageUrl()}
                                        alt={currentPlayer?.name || 'Player'}
                                        draggable="false"
                                        className="rounded-xl object-contain shadow-2xl transition-transform duration-150"
                                        style={{
                                            maxHeight: '80vh',
                                            maxWidth: '95vw',
                                            width: 'auto',
                                            height: 'auto',
                                            transform: `scale(${photoZoom})`,
                                            transformOrigin: 'center center'
                                        }}
                                    />
                                </div>
                                <p className="mt-2 text-xs text-white/70">Use + / − or mouse wheel to zoom</p>
                            </section>
                        </div>,
                        document.body
                    )}
                    {imageLoadState === 'loading' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PlayerImage;