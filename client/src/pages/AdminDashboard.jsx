import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('products');
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Product Form State
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '', description: '', price: '', stock: '', image_url: '', category_id: 1 // Default cat
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'products') {
                const { data } = await api.get('/products?limit=100'); // Get all for admin
                setProducts(data);
            } else {
                const { data } = await api.get('/orders');
                setOrders(data);
            }
        } catch (error) {
            console.error('Error fetching admin data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await api.delete(`/products/${id}`);
            setProducts(products.filter(p => p.id !== id));
        } catch (error) {
            alert('Failed to delete product');
        }
    };

    const handleEditClick = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            image_url: product.image_url || '',
            category_id: product.category_id || 1
        });
        setShowForm(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                const { data } = await api.put(`/products/${editingProduct.id}`, formData);
                setProducts(products.map(p => p.id === editingProduct.id ? data : p));
            } else {
                const { data } = await api.post('/products', formData);
                setProducts([data, ...products]);
            }
            setShowForm(false);
            setEditingProduct(null);
            setFormData({ name: '', description: '', price: '', stock: '', image_url: '', category_id: 1 });
        } catch (error) {
            console.error(error);
            alert('Failed to save product');
        }
    };

    const renderProductForm = () => (
        <div className="card mb-4">
            <div className="card-header bg-primary text-white">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
            </div>
            <div className="card-body">
                <form onSubmit={handleFormSubmit}>
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label>Name</label>
                            <input className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label>Price</label>
                            <input type="number" step="0.01" className="form-control" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
                        </div>
                        <div className="col-12 mb-3">
                            <label>Description</label>
                            <textarea className="form-control" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label>Stock</label>
                            <input type="number" className="form-control" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} required />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label>Image URL</label>
                            <input className="form-control" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-success me-2">Save</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                </form>
            </div>
        </div>
    );

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Admin Dashboard</h1>
            </div>

            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>Products</button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Orders</button>
                </li>
            </ul>

            {activeTab === 'products' && (
                <div>
                    {!showForm ? (
                        <button className="btn btn-primary mb-3" onClick={() => { setEditingProduct(null); setShowForm(true); }}>
                            + Add Product
                        </button>
                    ) : renderProductForm()}

                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p.id}>
                                    <td>{p.id}</td>
                                    <td>{p.name}</td>
                                    <td>${p.price}</td>
                                    <td>{p.stock}</td>
                                    <td>
                                        <button className="btn btn-sm btn-info me-2" onClick={() => handleEditClick(p)}>Edit</button>
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteProduct(p.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'orders' && (
                <div>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>User</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(o => (
                                <tr key={o.id}>
                                    <td>{o.id}</td>
                                    <td>{o.email}</td>
                                    <td>${o.total_amount}</td>
                                    <td>{o.status}</td>
                                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
