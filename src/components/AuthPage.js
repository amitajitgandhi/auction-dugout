import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { EMOJIS } from '../utils/constants';
import whatsappLogo from '../assets/Whatsapp.png';
import adLogo from '../assets/ad.png';

// Orbitron Title Font
const titleFont = {
    fontFamily: "'Orbitron', sans-serif",
};

// Feature List - Updated with 8 features including Spin Wheel and Jersey Color
const features = [
    {
        label: 'Live Streaming',
        icon: EMOJIS.VIDEO,
        desc: 'Broadcast the auction in real-time for all participants'
    },
    {
        label: 'Team Summary',
        icon: EMOJIS.TEAMOWNERVIEW,
        desc: 'Dedicated dashboard for team owners to manage bids'
    },
    {
        label: 'Whatsapp',
        icon: (
            <img 
                src={whatsappLogo} 
                alt="WhatsApp" 
                style={{ 
                    width: 36, 
                    height: 36, 
                    marginBottom: 8, 
                    marginTop: 12, 
                    display: 'block' 
                }} 
            />
        ),
        desc: 'Instant notifications and updates directly to your WhatsApp.'
    },
    {
        label: 'Smart UI',
        icon: EMOJIS.SMARTUI,
        desc: 'Modern, intuitive interface for a seamless auction'
    },
    {
        label: 'Export Teams',
        icon: EMOJIS.EXPORTTEAMS,
        desc: 'Download team data and results with a single click.'
    },
    {
        label: 'No Data Loss',
        icon: EMOJIS.NODATALOSS,
        desc: 'Automatic backups ensure your auction progress is always safe.'
    },
    {
        label: 'Spin Wheel',
        icon: EMOJIS.SPINWHEEL,
        desc: 'Interactive spin wheel for random team selection'
    },
    {
        label: 'Jersey Color',
        icon: EMOJIS.JERSEY,
        desc: 'Randomly assign jersey colors to each team'
    },
];

// Logo component
const Logo = () => (
    <motion.img
        src={adLogo}
        alt="Auction Dugout Logo"
        initial={{ rotate: -20, scale: 0.8, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        style={{ marginRight: 16, width: 100, height: 100, borderRadius: '50%', objectFit: 'contain' }}
    />
);

export default function AuthPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [highlightedTile, setHighlightedTile] = useState(-1); // Track which tile is highlighted (-1 = none)
    const { signIn, loading, error } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        await signIn(email, password);
        // The auth state change will be handled by the useAuth hook
    };

    useEffect(() => {
        document.title = 'Auction Dugout';
    }, []);

    // Auto-highlight feature tiles one by one
    useEffect(() => {
        const highlightInterval = setInterval(() => {
            setHighlightedTile(prevIndex => {
                if (prevIndex >= features.length - 1) {
                    return 0; // Reset to first tile
                }
                return prevIndex + 1;
            });
        }, 1500); // Change highlighted tile every 1.5 seconds

        // Initial delay before starting the highlight cycle
        const initialDelay = setTimeout(() => {
            setHighlightedTile(0);
        }, 2000); // Start highlighting after 2 seconds

        return () => {
            clearInterval(highlightInterval);
            clearTimeout(initialDelay);
        };
    }, []);

    return (
        <AnimatePresence>
            {true && (
                <motion.div
                    key="auth-page"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -40 }}
                    transition={{ duration: 0.7 }}
                    style={{
                        height: '100vh', // Fixed height instead of minHeight
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'linear-gradient(135deg, #18181b 0%, #1e293b 100%)',
                        fontFamily: 'Montserrat, sans-serif',
                        overflow: 'hidden', // Prevent any scrolling
                        position: 'relative',
                    }}
                >
                    {/* Fonts and Animated Title CSS */}
                    <style>
                        {`
              @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800&display=swap');
              @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap');

              .animated-title {
                font-size: 58px;
                font-weight: 900;
                font-family: 'Orbitron', sans-serif;
                letter-spacing: 1.5px;
                background: linear-gradient(270deg, #ef4444, #fbbf24, #0ea5e9, #ef4444);
                background-size: 800% 800%;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                animation: shineGradient 6s ease-in-out infinite;
                text-shadow: 0 4px 24px rgba(255, 255, 255, 0.25);
              }

              @keyframes shineGradient {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }

              /* Hide scrollbars globally for this page */
              body {
                overflow: hidden;
              }

              /* Highlight animation - Updated to match mouse hover exactly */
              @keyframes highlightAnimation {
                0% { 
                  transform: scale(1);
                  box-shadow: 0 6px 20px rgba(0,0,0,0.1);
                }
                50% { 
                  transform: scale(1.05);
                  box-shadow: 0 6px 20px #fbbf24;
                }
                100% { 
                  transform: scale(1);
                  box-shadow: 0 6px 20px rgba(0,0,0,0.1);
                }
              }

              .highlighted-tile {
                animation: highlightAnimation 1.5s ease-in-out;
                transform: scale(1.05) !important;
                box-shadow: 0 6px 20px #fbbf24 !important;
              }
            `}
                    </style>

                    {/* Compact Title */}
                    <div style={{ textAlign: 'center', marginTop: 20, marginBottom: 8 }}>
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <Logo />
                            <motion.h1
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3, duration: 1.2 }}
                                className="animated-title"
                            >
                                Auction Dugout
                            </motion.h1>
                        </motion.div>
                        <p style={{ color: '#fbbf24', fontWeight: 600, fontSize: 16, textShadow: '0 2px 8px #18181b', margin: 0 }}>
                            Smart, seamless cricket auctions.
                        </p>
                    </div>

                    {/* Main Content - Optimized for 100% zoom */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 20, // Optimal gap for 100% zoom
                        padding: '0 12px',
                        maxHeight: 'calc(100vh - 180px)', // Reserve space for title and footer
                        flexWrap: 'nowrap', // Force side-by-side layout
                        overflow: 'hidden',
                    }}>
                        {/* Login Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            style={{
                                background: 'rgba(255, 255, 255, 0.85)',
                                borderRadius: 16,
                                padding: 24,
                                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                                width: 300,
                                minHeight: 380,
                                backdropFilter: 'blur(10px)',
                                border: '1.5px solid #fbbf24',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <h2 style={{
                                color: '#ef4444',
                                fontWeight: 800,
                                textAlign: 'center',
                                marginBottom: 18,
                                fontSize: 20,
                                lineHeight: '1.2',
                            }}>
                                Login to the World of Auction
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                    style={{
                                        ...inputStyle,
                                        padding: '10px 12px',
                                        marginBottom: 12,
                                        fontSize: 14,
                                    }}
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={{
                                        ...inputStyle,
                                        padding: '10px 12px',
                                        marginBottom: 12,
                                        fontSize: 14,
                                    }}
                                />
                                {error && <p style={errorStyle}>{error}</p>}
                                <button type="submit" style={{
                                    ...buttonStyle,
                                    padding: 10,
                                    fontSize: 15,
                                }} disabled={loading}>
                                    {loading ? 'Logging in...' : 'Login'}
                                </button>
                            </form>
                            <p style={{
                                marginTop: 14,
                                textAlign: 'center',
                                fontSize: 11,
                                color: '#6b7280',
                                lineHeight: '1.3',
                            }}>
                                Only registered users can login. <br />
                                <a href="https://wa.me/+917276319578" target="_blank" rel="noreferrer" style={{ color: '#ef4444', fontWeight: 600 }}>
                                    Contact admin for access.
                                </a>
                            </p>
                        </motion.div>

                        {/* Vertical Separator */}
                        <div style={{
                            width: 1,
                            height: 380,
                            background: 'linear-gradient(180deg, #fbbf24 0%, #fde68a 100%)',
                            borderRadius: 8,
                            boxShadow: '0 0 4px #fbbf24',
                            border: '1px solid #fde68a',
                            flexShrink: 0,
                        }} />

                        {/* Auto-Highlighted Features Grid */}
                        <div style={{ 
                            width: 720,
                            flexShrink: 0,
                        }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gridTemplateRows: 'repeat(2, 1fr)',
                                gap: 18,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                                {features.map(({ icon, label, desc }, index) => (
                                    <motion.div
                                        key={label}
                                        className={highlightedTile === index ? 'highlighted-tile' : ''}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ 
                                            delay: index * 0.1 + 1,
                                            duration: 0.5,
                                            type: 'spring',
                                            stiffness: 200
                                        }}
                                        whileHover={false} // Removed mouse hover highlighter
                                        style={{
                                            background: '#fff',
                                            borderRadius: 16,
                                            width: 160,
                                            height: 160,
                                            padding: 14,
                                            textAlign: 'center',
                                            boxShadow: highlightedTile === index 
                                                ? '0 6px 20px #fbbf24' 
                                                : '0 6px 20px rgba(0,0,0,0.1)',
                                            fontWeight: 700,
                                            fontSize: 14,
                                            color: '#1f2937',
                                            cursor: 'default',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'flex-start',
                                            alignItems: 'center',
                                            border: highlightedTile === index ? '2px solid #fbbf24' : '2px solid transparent',
                                            transition: 'all 0.3s ease-in-out',
                                        }}
                                    >
                                        <motion.div 
                                            style={{ fontSize: 36, marginBottom: 6, marginTop: 4 }}
                                            animate={highlightedTile === index ? {
                                                scale: [1, 1.2, 1],
                                                rotate: [0, 5, -5, 0]
                                            } : {}}
                                            transition={{ duration: 0.6, ease: "easeInOut" }}
                                        >
                                            {icon}
                                        </motion.div>
                                        <div style={{ 
                                            fontWeight: 900, 
                                            fontSize: 15, 
                                            color: '#ef4444', 
                                            marginBottom: 4, 
                                            marginTop: 0,
                                        }}>
                                            {label}
                                        </div>
                                        <div style={{ 
                                            fontWeight: 500, 
                                            fontSize: 11, 
                                            color: '#374151', 
                                            marginTop: 0, 
                                            lineHeight: '1.2',
                                        }}>
                                            {desc}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Compact Footer */}
                    <footer style={{
                        padding: '8px 12px',
                        background: 'linear-gradient(90deg, #ef4444, #fbbf24, #0ea5e9)',
                        backgroundSize: '300% 300%',
                        animation: 'pulseFooter 8s ease infinite',
                        textAlign: 'center',
                        color: '#f3f4f6',
                        fontWeight: 600,
                        fontSize: 11,
                        boxShadow: '0 -2px 16px rgba(0,0,0,0.3)',
                        flexShrink: 0,
                    }}>
                        <style>
                            {`
                          @keyframes pulseFooter {
                            0% { background-position: 0% 50%; }
                            50% { background-position: 100% 50%; }
                            100% { background-position: 0% 50%; }
                          }
                        `}
                        </style>

                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span>Powered by</span>
                            <a
                                href="https://www.linkedin.com/in/amitajitgandhi/"
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    color: '#f3f4f6',
                                    fontWeight: 800,
                                    textDecoration: 'underline',
                                }}
                            >
                                AMIT GANDHI
                            </a>
                            <a
                                href="https://wa.me/+917276319578"
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'flex', alignItems: 'center' }}
                            >
                                <img
                                    src={whatsappLogo}
                                    alt="WhatsApp"
                                    style={{ width: 16, height: 16 }}
                                />
                            </a>
                        </div>
                    </footer>

                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Compact Styles
const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    marginBottom: 14,
    fontSize: 14,
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    fontWeight: 500,
    outline: 'none',
};

const buttonStyle = {
    width: '100%',
    padding: 12,
    background: 'linear-gradient(to right, #fbbf24, #ef4444)',
    color: '#fff',
    fontWeight: 800,
    fontSize: 16,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
};

const errorStyle = {
    color: '#dc2626',
    fontWeight: 600,
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
};