import React from 'react';
import QRCode from 'react-qr-code';

const DemoBarcode = ({ sku, name, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl flex flex-col items-center">
                <div className="flex justify-between items-center w-full mb-4">
                    <h3 className="text-lg font-bold">Demo Product QR Code</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 font-bold text-xl"
                    >
                        ✕
                    </button>
                </div>

                <div className="border-4 border-gray-800 p-4 rounded bg-white">
                    <QRCode value={sku} size={200} />
                </div>

                <h4 className="mt-4 text-xl font-semibold text-gray-800">{name}</h4>
                <p className="text-gray-500 mt-2">Scan this QR code to add to cart</p>
            </div>
        </div>
    );
};

export default DemoBarcode;
