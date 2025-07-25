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
        desc: 'Broadcast the auction in real-time for all participants and viewers.'
    },
    {
        label: 'Team Summary',
        icon: EMOJIS.TEAMOWNERVIEW,
        desc: 'Dedicated dashboard for team owners to manage bids and strategies.'
    },
    {
        label: 'Whatsapp',
        icon: <img src={whatsappLogo} alt="WhatsApp" style={{ width: 44, height: 44, marginBottom: 0, marginTop: 13, display: 'block' }} />,
        desc: 'Instant notifications and updates directly to your WhatsApp.'
    },
    {
        label: 'Smart UI',
        icon: EMOJIS.SMARTUI,
        desc: 'Modern, intuitive interface for a seamless auction experience.'
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
        style={{ marginRight: 20, width: 120, height: 120, borderRadius: '50%', objectFit: 'contain' }}
    />
);

export default function AuthPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { signIn, loading, error } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        await signIn(email, password);
        // The auth state change will be handled by the useAuth hook
    };

    useEffect(() => {
        document.title = 'Auction Dugout';
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
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        // Changed background to a dark gradient
                        background: 'linear-gradient(135deg, #18181b 0%, #1e293b 100%)',
                        fontFamily: 'Montserrat, sans-serif',
                        overflow: 'hidden',
                        position: 'relative',
                    }}
                >
                    {/* Fonts and Animated Title CSS */}
                    <style>
                        {`
              @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800&display=swap');
              @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap');

              .animated-title {
                font-size: 72px;
                font-weight: 900;
                font-family: 'Orbitron', sans-serif;
                letter-spacing: 2px;
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
            `}
                    </style>

                    {/* Title */}
                    <div style={{ textAlign: 'center', marginTop: 32, marginBottom: 12 }}>
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: 12,
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
                        <p style={{ color: '#fbbf24', fontWeight: 600, fontSize: 18, textShadow: '0 2px 8px #18181b' }}>
                            Smart, seamless cricket auctions.
                        </p>
                    </div>

                    {/* Login + Features */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 32, // Reduced gap
                        padding: '0 24px',
                    }}>
                        {/* Login Card - Moved more to the left */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            style={{
                                background: 'rgba(255, 255, 255, 0.85)',
                                borderRadius: 20,
                                padding: 40, // Reduced padding
                                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                                minWidth: 320, // Reduced minimum width
                                maxWidth: 420, // Reduced maximum width
                                minHeight: 460, // Reduced height
                                width: '100%',
                                backdropFilter: 'blur(10px)',
                                border: '1.5px solid #fbbf24',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                marginRight: 20, // Push login more to the left
                            }}
                        >
                            <h2 style={{
                                color: '#ef4444',
                                fontWeight: 800,
                                textAlign: 'center',
                                marginBottom: 24,
                                fontSize: 26, // Slightly smaller
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
                                    style={inputStyle}
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={inputStyle}
                                />
                                {error && <p style={errorStyle}>{error}</p>}
                                <button type="submit" style={buttonStyle} disabled={loading}>
                                    {loading ? 'Logging in...' : 'Login'}
                                </button>
                            </form>
                            <p style={{
                                marginTop: 20,
                                textAlign: 'center',
                                fontSize: 14,
                                color: '#6b7280',
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
                            minHeight: 480, // Reduced height
                            height: '60%',
                            background: 'linear-gradient(180deg, #fbbf24 0%, #fde68a 100%)',
                            borderRadius: 12,
                            boxShadow: '0 0 4px #fbbf24',
                            border: '1px solid #fde68a',
                        }} />

                        {/* Features Grid - Updated for 4x2 layout */}
                        <div style={{ minWidth: 720, maxWidth: 1000 }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)', // 4 columns instead of 3
                                gridTemplateRows: 'repeat(2, 1fr)', // 2 rows
                                gap: 24, // Reduced gap
                            }}>
                                {features.map(({ icon, label, desc }) => (
                                    <motion.div
                                        key={label}
                                        whileHover={{ scale: 1.08, boxShadow: '0 8px 32px #fbbf24' }}
                                        transition={{ type: 'spring', stiffness: 300 }}
                                        style={{
                                            background: '#fff',
                                            borderRadius: 24, // Slightly smaller
                                            width: 200, // Reduced width to fit 4 in a row
                                            height: 200, // Reduced height
                                            padding: 18, // Reduced padding
                                            textAlign: 'center',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.11)',
                                            fontWeight: 700,
                                            fontSize: 16, // Slightly smaller
                                            color: '#1f2937',
                                            cursor: 'default',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'flex-start',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <div style={{ fontSize: 38, marginBottom: 8, marginTop: 6 }}>{icon}</div>
                                        <div style={{ fontWeight: 900, fontSize: 18, color: '#ef4444', marginBottom: 6, marginTop: 0 }}>{label}</div>
                                        <div style={{ fontWeight: 500, fontSize: 12, color: '#374151', marginTop: 0, lineHeight: '1.3' }}>{desc}</div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Stylish Footer */}
                    <footer style={{
                        marginTop: 'auto',
                        padding: '12px 16px',
                        background: 'linear-gradient(90deg, #ef4444, #fbbf24, #0ea5e9)',
                        backgroundSize: '300% 300%',
                        animation: 'pulseFooter 8s ease infinite',
                        textAlign: 'center',
                        color: '#f3f4f6',
                        fontWeight: 600,
                        fontSize: 12,
                        boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
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

                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
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
                                    style={{ width: 20, height: 20 }}
                                />
                            </a>
                        </div>
                    </footer>

                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Styles
const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    marginBottom: 16,
    fontSize: 16,
    borderRadius: 10,
    border: '1px solid #e5e7eb',
    fontWeight: 500,
    outline: 'none',
};

const buttonStyle = {
    width: '100%',
    padding: 14,
    background: 'linear-gradient(to right, #fbbf24, #ef4444)',
    color: '#fff',
    fontWeight: 800,
    fontSize: 18,
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
};

const errorStyle = {
    color: '#dc2626',
    fontWeight: 600,
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
};