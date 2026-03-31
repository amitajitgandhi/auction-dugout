import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import CricketAuctionTool from "./App.js";
import ViewerPage from "./components/ViewerPage";

// Simple hash-based router: #/viewer/USER_ID renders the read-only viewer page
function AppRouter() {
    const [hash, setHash] = useState(window.location.hash);

    useEffect(() => {
        const handleHashChange = () => setHash(window.location.hash);
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const viewerMatch = hash.match(/^#\/viewer\/(.+)$/);
    if (viewerMatch) {
        return <ViewerPage userId={viewerMatch[1]} />;
    }

    return <CricketAuctionTool />;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<AppRouter />);