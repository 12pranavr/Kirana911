import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Upload, X } from 'lucide-react';

const BarcodeScanner = ({ onScan, onClose }) => {
    const [mode, setMode] = useState('menu'); // 'menu', 'camera', 'upload'
    const [error, setError] = useState('');
    const scannerRef = useRef(null);
    const fileInputRef = useRef(null);
    const regionId = "html5qr-code-full-region";

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (scannerRef.current) {
                if (scannerRef.current.isScanning) {
                    scannerRef.current.stop().catch(console.error);
                }
                scannerRef.current.clear();
            }
        };
    }, []);

    const startCamera = async () => {
        setMode('camera');
        setError('');

        try {
            const scanner = new Html5Qrcode(regionId);
            scannerRef.current = scanner;

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };

            await scanner.start(
                { facingMode: "environment" },
                config,
                (decodedText) => {
                    // Success
                    // stopScanner(); // Keep scanner running
                    onScan(decodedText);
                },
                (errorMessage) => {
                    // Ignore NotFoundException, it just means no code in current frame
                    // Only log real errors if needed
                    // console.log(errorMessage);
                }
            );
        } catch (err) {
            setError("Failed to start camera. Please ensure permissions are granted.");
            console.error(err);
            setMode('menu');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const scanner = new Html5Qrcode(regionId);
            // No need to assign to ref for file scan, but good for consistency if we wanted to clear

            const result = await scanner.scanFile(file, true);
            onScan(result);
        } catch (err) {
            setError("Could not find a barcode in this image. Please try a clearer image.");
            console.error("File scan error:", err);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            await scannerRef.current.stop();
            scannerRef.current.clear();
        }
    };

    const handleClose = async () => {
        await stopScanner();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full relative">
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                    <X className="w-6 h-6" />
                </button>

                <h3 className="text-xl font-bold mb-6 text-center text-gray-800">Scan Barcode</h3>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                        {error}
                    </div>
                )}

                {/* Container for the scanner - must exist for library to attach */}
                <div id={regionId} className={`w-full ${mode === 'camera' ? 'block' : 'hidden'} mb-4 overflow-hidden rounded-lg bg-gray-100`}></div>

                {mode === 'menu' && (
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={startCamera}
                            className="flex items-center justify-center gap-3 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Camera className="w-6 h-6" />
                            <span className="font-semibold">Scan with Camera</span>
                        </button>

                        <div className="relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                                ref={fileInputRef}
                            />
                            <button
                                onClick={() => fileInputRef.current.click()}
                                className="w-full flex items-center justify-center gap-3 p-4 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors border-2 border-dashed border-gray-300"
                            >
                                <Upload className="w-6 h-6 text-gray-600" />
                                <span className="font-semibold">Upload Image</span>
                            </button>
                        </div>
                    </div>
                )}

                {mode === 'camera' && (
                    <div className="text-center">
                        <p className="text-sm text-gray-500 mb-4">Point camera at a barcode</p>
                        <button
                            onClick={() => {
                                stopScanner();
                                setMode('menu');
                            }}
                            className="text-red-600 font-medium hover:underline"
                        >
                            Stop Scanning
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BarcodeScanner;
