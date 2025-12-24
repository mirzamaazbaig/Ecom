import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data } = await api.get('/orders/my-orders');
                setOrders(data);
            } catch (error) {
                console.error('Failed to fetch orders', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    if (loading) return <div className="text-center mt-5">Loading...</div>;

    if (orders.length === 0) {
        return <div className="container mt-5 text-center"><h2>No orders found</h2></div>;
    }

    return (
        <div className="container mt-5">
            <h2 className="mb-4">My Orders</h2>
            <div className="accordion" id="ordersAccordion">
                {orders.map((order, index) => (
                    <div className="accordion-item" key={order.id}>
                        <h2 className="accordion-header" id={`heading${order.id}`}>
                            <button
                                className={`accordion-button ${index !== 0 ? 'collapsed' : ''}`}
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target={`#collapse${order.id}`}
                            >
                                <div className="d-flex justify-content-between w-100 me-3">
                                    <span>Order #{order.id}</span>
                                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                                    <span className="badge bg-success">{order.status.toUpperCase()}</span>
                                    <span>${parseFloat(order.total_amount).toFixed(2)}</span>
                                </div>
                            </button>
                        </h2>
                        <div
                            id={`collapse${order.id}`}
                            className={`accordion-collapse collapse ${index === 0 ? 'show' : ''}`}
                            data-bs-parent="#ordersAccordion"
                        >
                            <div className="accordion-body">
                                <ul className="list-group">
                                    {order.items && order.items.map((item, idx) => (
                                        <li className="list-group-item d-flex justify-content-between align-items-center" key={idx}>
                                            <div className="d-flex align-items-center">
                                                <img
                                                    src={item.image || 'https://via.placeholder.com/40'}
                                                    alt={item.name}
                                                    style={{ width: '40px', height: '40px', objectFit: 'cover', marginRight: '10px' }}
                                                />
                                                <span>{item.name} (x{item.quantity})</span>
                                            </div>
                                            <span>${item.price}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-3 text-end text-muted">
                                    <small>Transaction Hash: {order.transaction_hash || 'Pending Chain Sync'}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyOrders;
