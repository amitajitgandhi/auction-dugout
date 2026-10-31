import React, { useState, useEffect } from "react";
import { getDefaultPlayerImage } from "../utils/constants";

const PlayerImage = ({ currentPlayer, imageKey, setImageKey }) => {
    const [imageLoadState, setImageLoadState] = useState('loading');
    const [useBackupIcon, setUseBackupIcon] = useState(false);
    const [urlAttempt, setUrlAttempt] = useState(0);

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
                    <a
                        href={getOriginalDriveLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'block', width: '100%', height: '100%' }}
                    >
                        <img
                            key={imageKey}
                            src={getPlayerImageUrl()}
                            alt={currentPlayer?.name || 'Player'}
                            className="w-full h-full object-cover"
                            onError={handlePlayerImageError}
                            onLoad={handleImageLoad}
                            style={{
                                display: imageLoadState === 'error' ? 'none' : 'block',
                                width: '100%',
                                height: '100%'
                            }}
                        />
                    </a>
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