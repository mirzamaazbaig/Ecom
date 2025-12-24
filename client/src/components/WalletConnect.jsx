import React, { useState, useEffect } from 'react';

const WalletConnect = ({ onConnect }) => {
    const [account, setAccount] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                setAccount(accounts[0] || null);
                if (onConnect) onConnect(accounts[0] || null);
            });
        }
    }, [onConnect]);

    const connectWallet = async () => {
        if (!window.ethereum) {
            setError('MetaMask not detected. Please install it.');
            return;
        }

        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setAccount(accounts[0]);
            setError('');
            if (onConnect) onConnect(accounts[0]);
        } catch (err) {
            console.error(err);
            setError('Connection rejected');
        }
    };

    return (
        <div className="d-inline-block">
            {error && <span className="text-danger me-2 small">{error}</span>}
            {account ? (
                <button className="btn btn-outline-warning btn-sm" disabled>
                    {account.slice(0, 6)}...{account.slice(-4)}
                </button>
            ) : (
                <button className="btn btn-warning btn-sm" onClick={connectWallet}>
                    Connect Wallet
                </button>
            )}
        </div>
    );
};

export default WalletConnect;
