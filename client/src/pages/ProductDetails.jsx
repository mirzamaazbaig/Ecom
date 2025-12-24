import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../context/CartContext';

const ProductDetails = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const { addToCart } = useCart();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data } = await api.get(`/products/${id}`);
                setProduct(data);
            } catch (error) {
                console.error('Failed to fetch product', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleAddToCart = () => {
        addToCart(product, quantity);
        alert(`Added ${quantity} of ${product.name} to cart!`);
    };

    if (loading) return <div className="text-center mt-5">Loading...</div>;
    if (!product) return <div className="text-center mt-5">Product not found</div>;

    return (
        <div className="container mt-5">
            <div className="row">
                <div className="col-md-6">
                    <img
                        src={product.image_url || 'https://via.placeholder.com/400'}
                        className="img-fluid rounded"
                        alt={product.name}
                    />
                </div>
                <div className="col-md-6">
                    <h2>{product.name}</h2>
                    <h4 className="text-muted">${product.price}</h4>
                    <p className="lead mt-3">{product.description}</p>
                    <p><strong>Category:</strong> {product.category_name || 'Uncategorized'}</p>
                    <p><strong>Stock:</strong> {product.stock > 0 ? product.stock : 'Out of Stock'}</p>

                    <div className="d-flex align-items-center mt-4">
                        <input
                            type="number"
                            className="form-control"
                            style={{ width: '80px', marginRight: '10px' }}
                            value={quantity}
                            min="1"
                            max={product.stock}
                            onChange={(e) => setQuantity(parseInt(e.target.value))}
                        />
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleAddToCart}
                            disabled={product.stock <= 0}
                        >
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
