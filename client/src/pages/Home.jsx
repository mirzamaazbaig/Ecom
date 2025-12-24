import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data } = await api.get('/products');
                setProducts(data);
            } catch (error) {
                console.error('Failed to fetch products', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    if (loading) return <div className="text-center mt-5">Loading...</div>;

    return (
        <div className="container mt-4">
            <h1 className="mb-4">Latest Products</h1>
            <div className="row">
                {products.map(product => (
                    <div className="col-md-3 mb-4" key={product.id}>
                        <div className="card h-100">
                            <img
                                src={product.image_url || 'https://via.placeholder.com/200'}
                                className="card-img-top"
                                alt={product.name}
                                style={{ height: '200px', objectFit: 'cover' }}
                            />
                            <div className="card-body d-flex flex-column">
                                <h5 className="card-title">{product.name}</h5>
                                <p className="card-text text-truncate">{product.description}</p>
                                <div className="mt-auto d-flex justify-content-between align-items-center">
                                    <span className="h5 mb-0">${product.price}</span>
                                    <Link to={`/products/${product.id}`} className="btn btn-primary btn-sm">View</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Home;
