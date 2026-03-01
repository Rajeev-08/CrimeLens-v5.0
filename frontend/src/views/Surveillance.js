import React, { useState } from 'react';
import axios from 'axios';

const Surveillance = ({ onBack }) => {
    const [streamSource, setStreamSource] = useState(null); 
    const [detectionMode, setDetectionMode] = useState("weapon"); // 'weapon', 'violence', 'shoplifting'
    const [isUploading, setIsUploading] = useState(false);

    const handleWebcamStart = () => {
        setStreamSource("webcam");
    };
    const handleStopStream = async () => {
    try {
        await axios.get("http://localhost:8000/api/surveillance/stop");
        setStreamSource(null); // This clears the <img> tag in the UI
    } catch (err) {
        console.error("Failed to stop stream", err);
    }
};
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await axios.post("http://localhost:8000/api/surveillance/upload", formData);
            setStreamSource(res.data.path);
        } catch (err) {
            alert("Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <h1 className="font-bold text-lg tracking-wider">LIVE SURVEILLANCE MONITOR</h1>
                </div>
                <button onClick={onBack} className="text-sm text-gray-400 hover:text-white">Exit System</button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Controls */}
                <div className="w-72 bg-gray-800 p-4 border-r border-gray-700 flex flex-col gap-8 overflow-y-auto">
                    
                    {/* Input Source Section */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">1. Input Source</h3>
                            <div className="flex flex-col gap-2">
                                <button 
                                    onClick={handleWebcamStart}
                                    className={`p-3 rounded text-sm font-medium transition-colors border ${streamSource === 'webcam' ? 'bg-blue-900/30 border-blue-500 text-blue-400' : 'bg-gray-700 border-transparent hover:bg-gray-600'}`}
                                >
                                    📷 Live Webcam
                                </button>
                                <label className={`p-3 rounded text-sm font-medium transition-colors border cursor-pointer text-center ${streamSource && streamSource !== 'webcam' ? 'bg-blue-900/30 border-blue-500 text-blue-400' : 'bg-gray-700 border-transparent hover:bg-gray-600'}`}>
                                    {isUploading ? "Uploading..." : "📁 Upload Footage"}
                                    <input type="file" className="hidden" onChange={handleFileUpload} accept="video/*" />
                                </label>

                                {/* ✅ NEW: CLOSE BUTTON */}
                                {streamSource && (
                                    <button 
                                        onClick={handleStopStream}
                                        className="mt-2 p-2 rounded text-xs font-bold bg-red-600/20 border border-red-500 text-red-500 hover:bg-red-600 hover:text-white transition-all"
                                    >
                                        🛑 Close Current Feed
                                    </button>
                                )}
                            </div>
                        </div>

                    {/* Detection Mode Section */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">2. AI Detection Mode</h3>
                        <div className="flex flex-col gap-2">
                            
                            {/* WEAPON MODE */}
                            <button 
                                onClick={() => setDetectionMode("weapon")}
                                className={`p-3 rounded text-left text-sm font-medium border transition-all ${
                                    detectionMode === 'weapon' 
                                    ? 'bg-red-900/40 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                                    : 'bg-gray-700 border-transparent text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <span>Weapon Detection</span>
                                    {detectionMode === 'weapon' && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                                </div>
                                <span className="text-xs opacity-70 font-normal mt-1 block">YOLOv11 + ByteTrack</span>
                            </button>

                            {/* VIOLENCE MODE */}
                            <button 
                                onClick={() => setDetectionMode("violence")}
                                className={`p-3 rounded text-left text-sm font-medium border transition-all ${
                                    detectionMode === 'violence' 
                                    ? 'bg-orange-900/40 border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]' 
                                    : 'bg-gray-700 border-transparent text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <span>Violence Detection</span>
                                    {detectionMode === 'violence' && <span className="w-2 h-2 bg-orange-500 rounded-full"></span>}
                                </div>
                                <span className="text-xs opacity-70 font-normal mt-1 block">3D-CNN / LSTM</span>
                            </button>

                            {/* SHOPLIFTING MODE (NEW) */}
                                <button 
                                    onClick={() => setDetectionMode("shoplifting")}
                                    className={`p-3 rounded text-left text-sm font-medium border transition-all ${
                                        detectionMode === 'shoplifting' 
                                        ? 'bg-purple-900/40 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                                        : 'bg-gray-700 border-transparent text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span>
                                            Shoplifting Detection 
                                            <span className="text-[10px] text-red-500 ml-1 font-bold animate-pulse">
                                                (experimental)
                                            </span>
                                        </span>
                                        {detectionMode === 'shoplifting' && <span className="w-2 h-2 bg-purple-500 rounded-full"></span>}
                                    </div>
                                    <span className="text-xs opacity-70 font-normal mt-1 block">ResNet18 / Behavioral</span>
                                </button>

                        </div>
                    </div>

                    {/* Status Console */}
                    <div className="mt-auto bg-black/40 p-3 rounded border border-gray-700 text-xs font-mono text-gray-400">
                        <div className="mb-1">STATUS: <span className="text-green-500">SYSTEM READY</span></div>
                        <div className="mb-1">MODE: <span className="text-white uppercase">{detectionMode}</span></div>
                        <div>SOURCE: <span className="text-white">{streamSource || "NONE"}</span></div>
                    </div>
                </div>

                {/* Main Feed */}
                <div className="flex-1 bg-black flex items-center justify-center relative">
                    {streamSource ? (
                        <img 
                            // Dynamic URL updates when detectionMode changes
                            src={`http://localhost:8000/api/surveillance/feed?source=${streamSource}&mode=${detectionMode}&t=${Date.now()}`} 
                            alt="Live Stream"
                            className="max-h-full max-w-full object-contain"
                        />
                    ) : (
                        <div className="text-center text-gray-600">
                            <div className="text-6xl mb-4 opacity-20">👁️</div>
                            <p className="text-xl font-mono mb-2">AWAITING INPUT</p>
                            <p className="text-sm">Select Source & Mode to Begin</p>
                        </div>
                    )}
                    
                    {/* HUD Overlay */}
                    {streamSource && (
                        <div className="absolute top-4 right-4 text-green-500 font-mono text-xs bg-black/50 p-2 rounded backdrop-blur-sm border border-green-500/30">
                            REC: ● LIVE<br/>
                            AI: {detectionMode.toUpperCase()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Surveillance;