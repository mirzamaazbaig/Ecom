import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../context/CartContext';

const Wishlist = () => {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();
    const navigate = useNavigate();

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        try {
            const { data } = await api.get('/wishlist');
            setWishlistItems(data);
        } catch (error) {
            console.error('Error fetching wishlist', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFromWishlist = async (productId) => {
        try {
            await api.delete(`/wishlist/${productId}`);
            setWishlistItems(wishlistItems.filter(item => item.product_id !== productId));
        } catch (error) {
            console.error('Error removing from wishlist', error);
            alert('Failed to remove from wishlist');
        }
    };

    const handleAddToCart = (item) => {
        addToCart({
            id: item.product_id,
            name: item.name,
            price: item.price,
            image_url: item.image_url
        });
        alert(`Added ${item.name} to cart!`);
    };

    if (loading) {
        return <div className="container mt-5 text-center">Loading...</div>;
    }

    if (wishlistItems.length === 0) {
        return (
            <div className="container mt-5 text-center fade-in">
                <h2>Your Wishlist is Empty</h2>
                <p className="text-muted">Save your favorite items here!</p>
                <button className="btn btn-primary mt-3" onClick={() => navigate('/')}>
                    Browse Products
                </button>
            </div>
        );
    }

    return (
        <div className="container mt-5 fade-in">
            <h2 className="mb-4">My Wishlist</h2>
            <div className="row">
                {wishlistItems.map((item) => (
                    <div key={item.id} className="col-md-4 col-lg-3 mb-4">
                        <div className="card h-100">
                            <div style={{ height: '200px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <img
                                    src={item.image_url || 'https://via.placeholder.com/200'}
                                    className="card-img-top"
                                    alt={item.name}
                                    style={{ maxHeight: '100%', width: 'auto' }}
                                />
                            </div>
                            <div className="card-body d-flex flex-column">
                                <h5 className="card-title text-truncate" title={item.name}>
                                    <Link to={`/products/${item.product_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        {item.name}
                                    </Link>
                                </h5>
                                <p className="card-text fw-bold fs-5">${Number(item.price).toFixed(2)}</p>
                                <div className="mt-auto">
                                    <button
                                        className="btn btn-primary w-100 mb-2"
                                        onClick={() => handleAddToCart(item)}
                                    >
                                        Add to Cart
                                    </button>
                                    <button
                                        className="btn btn-outline-danger w-100"
                                        onClick={() => handleRemoveFromWishlist(item.product_id)}
                                    >
                                        Remove from Wishlist
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Wishlist;
