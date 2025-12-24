import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Cart = () => {
    const { cartItems, removeFromCart, clearCart, cartTotal } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        setLoading(true);
        try {
            // Simulate Web3 Hash generation if user has wallet
            let txHash = null;
            if (window.ethereum && window.ethereum.selectedAddress) {
                // In a real app, we would send a transaction here:
                // txHash = await sendTransaction(totalAmount);
                // For demo/portfolio: create a mock hash to show "Digital Receipt"
                txHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
            }

            await api.post('/orders', {
                totalAmount: cartTotal,
                items: cartItems,
                transactionHash: txHash
            });
            clearCart();
            alert('Order placed successfully!' + (txHash ? ' Digital Receipt Generated on Chain.' : ''));
            navigate('/my-orders');
        } catch (error) {
            console.error('Checkout failed', error);
            alert('Checkout failed: ' + (error.response?.data?.message || 'Server Error'));
        } finally {
            setLoading(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="container mt-5 text-center">
                <h2>Your Cart is Empty</h2>
                <button className="btn btn-primary mt-3" onClick={() => navigate('/')}>Browse Products</button>
            </div>
        );
    }

    return (
        <div className="container mt-5">
            <h2 className="mb-4">Shopping Cart</h2>
            <div className="row">
                <div className="col-md-8">
                    <ul className="list-group mb-3">
                        {cartItems.map((item) => (
                            <li className="list-group-item d-flex justify-content-between lh-sm" key={item.productId}>
                                <div className="d-flex align-items-center">
                                    <img
                                        src={item.image || 'https://via.placeholder.com/50'}
                                        alt={item.name}
                                        style={{ width: '50px', height: '50px', objectFit: 'cover', marginRight: '15px' }}
                                    />
                                    <div>
                                        <h6 className="my-0">{item.name}</h6>
                                        <small className="text-muted">Quantity: {item.quantity}</small>
                                    </div>
                                </div>
                                <div className="text-end">
                                    <span className="text-muted">${(item.price * item.quantity).toFixed(2)}</span>
                                    <br />
                                    <button
                                        className="btn btn-sm btn-outline-danger mt-1"
                                        onClick={() => removeFromCart(item.productId)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="col-md-4">
                    <div className="card">
                        <div className="card-body">
                            <h4 className="card-title d-flex justify-content-between align-items-center mb-3">
                                <span className="text-primary">Summary</span>
                            </h4>
                            <ul className="list-group mb-3">
                                <li className="list-group-item d-flex justify-content-between">
                                    <span>Total (USD)</span>
                                    <strong>${cartTotal.toFixed(2)}</strong>
                                </li>
                            </ul>
                            <button
                                className="btn btn-success w-100 btn-lg"
                                onClick={handleCheckout}
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Checkout'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
