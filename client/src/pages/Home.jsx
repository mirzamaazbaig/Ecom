import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../context/CartContext';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();

    // Filters
    const [selectedCategory, setSelectedCategory] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sortBy, setSortBy] = useState('avg_rating'); // Default sort

    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('search') || '';

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [selectedCategory, maxPrice, sortBy, searchQuery]);

    const fetchCategories = async () => {
        try {
            // Hardcoded for now or fetch if API exists.
            setCategories(['Electronics', 'Clothing', 'Books']);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            let query = `/products?sort_by=${sortBy}`;
            if (selectedCategory) {
                const catMap = { 'Electronics': 1, 'Clothing': 2, 'Books': 3 };
                query += `&category_id=${catMap[selectedCategory] || ''}`;
            }
            if (maxPrice) query += `&max_price=${maxPrice}`;
            if (searchQuery) query += `&search=${encodeURIComponent(searchQuery)}`;

            const { data } = await api.get(query);
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid px-0">
            {/* Hero Section */}
            {!searchQuery && (
                <div className="hero-container">
                    <div className="hero-content">
                        <h1 className="fade-in">Summer Sale is Live!</h1>
                        <p className="lead slide-in">Up to 50% off on all Electronics</p>
                        <button className="btn btn-warning btn-lg mt-3" onClick={() => setSelectedCategory('Electronics')}>Shop Now</button>
                    </div>
                </div>
            )}

            <div className="container-fluid ps-4 pe-4">
                <div className="row">
                    {/* Sidebar */}
                    <div className="col-md-2 d-none d-md-block sidebar">
                        <div className="filter-section">
                            <h5>Categories</h5>
                            <ul>
                                <li className={!selectedCategory ? 'fw-bold text-primary' : ''} onClick={() => setSelectedCategory('')}>All Departments</li>
                                {categories.map(cat => (
                                    <li key={cat} className={selectedCategory === cat ? 'fw-bold text-primary' : ''} onClick={() => setSelectedCategory(cat)}>
                                        {cat}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <hr />
                        <div className="filter-section">
                            <h5>Price</h5>
                            <input
                                type="range"
                                className="form-range"
                                min="0"
                                max="2000"
                                step="50"
                                value={maxPrice || 2000}
                                onChange={(e) => setMaxPrice(e.target.value)}
                            />
                            <div className="d-flex justify-content-between">
                                <small>$0</small>
                                <small>${maxPrice || 2000}</small>
                            </div>
                        </div>
                        <hr />
                        <div className="filter-section">
                            <h5>Sort By</h5>
                            <select className="form-select form-select-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="avg_rating">Avg. Customer Review</option>
                                <option value="price">Price: Low to High</option>
                                <option value="created_at">Newest Arrivals</option>
                            </select>
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="col-md-10">
                        {searchQuery && <h3>Results for "{searchQuery}"</h3>}
                        <div className="row">
                            {products.length === 0 && !loading && <p>No products found.</p>}
                            {products.map(product => (
                                <div key={product.id} className="col-md-4 col-lg-3 mb-4">
                                    <div className="card h-100 fade-in">
                                        <div style={{ height: '200px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <img src={product.image_url} className="card-img-top" alt={product.name} style={{ maxHeight: '100%', width: 'auto' }} />
                                        </div>
                                        <div className="card-body d-flex flex-column">
                                            <h5 className="card-title text-truncate" title={product.name}>
                                                <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                    {product.name}
                                                </Link>
                                            </h5>

                                            {/* Rating Stars Mockup */}
                                            <div className="mb-2">
                                                <span className="text-warning">
                                                    {'★'.repeat(Math.round(product.avg_rating || 0))}
                                                    {'☆'.repeat(5 - Math.round(product.avg_rating || 0))}
                                                </span>
                                                <small className="text-muted ms-1">({product.review_count || 0})</small>
                                            </div>

                                            <p className="card-text fw-bold fs-5">${Number(product.price).toFixed(2)}</p>

                                            <div className="mt-auto">
                                                <button
                                                    className="btn btn-primary w-100 mb-2"
                                                    onClick={() => addToCart(product)}
                                                >
                                                    Add to Cart
                                                </button>
                                                <Link to={`/products/${product.id}`} className="btn btn-outline-secondary w-100">
                                                    View Details
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Home;
