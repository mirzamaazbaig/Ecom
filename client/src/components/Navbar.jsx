import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import WalletConnect from './WalletConnect';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { cartCount } = useCart();
    const navigate = useNavigate();

    // We can store wallet in global state if needed, but for now local to component or pass down is okay.
    // Actually, maybe better to put in Context if we want to use it in Checkout.
    // For "Bootcamp" level, let's keep it simple: Navbar shows it, Checkout might need to reconnect or we lift state.
    // Let's lift state to LocalStorage or a simple Context later if needed. 
    // For now, let's just show it in Navbar as requested "Connect Wallet".
    // To make it useful in Checkout, we need to know the address there.
    // I'll assume users connect in Navbar, and we might need to "re-verify" or access window.ethereum directly in Cart.

    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/?search=${encodeURIComponent(searchTerm)}`);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark">
            <div className="container-fluid">
                <Link className="navbar-brand me-4" to="/">E-Com</Link>

                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
                    {/* Search Bar */}
                    <form className="navbar-search d-flex" onSubmit={handleSearch}>
                        <div className="search-input-group w-100">
                            <select className="form-select" style={{ maxWidth: '80px', borderRadius: '4px 0 0 4px', fontSize: '0.8rem', backgroundColor: '#f3f3f3', border: 'none' }}>
                                <option>All</option>
                            </select>
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button className="search-btn" type="submit">
                                🔍
                            </button>
                        </div>
                    </form>

                    <ul className="navbar-nav ms-auto align-items-center">
                        <li className="nav-item me-2">
                            <Link className="nav-link" to="/wishlist">
                                <small>Your</small>
                                <span>Wishlist</span>
                            </Link>
                        </li>
                        {user && (
                            <li className="nav-item me-2">
                                <Link className="nav-link" to="/my-orders">
                                    <small>Returns</small>
                                    <span>& Orders</span>
                                </Link>
                            </li>
                        )}
                        <li className="nav-item me-2">
                            <Link className="nav-link position-relative" to="/cart">
                                <div className="d-flex flex-column align-items-center">
                                    <span style={{ fontSize: '1.2rem' }}>🛒</span>
                                    {cartCount > 0 && (
                                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark">
                                            {cartCount}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        </li>
                        {user ? (
                            <li className="nav-item dropdown">
                                <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                                    <span>{user.email.split('@')[0]} ▼</span>
                                </a>
                                <ul className="dropdown-menu dropdown-menu-end">
                                    <li><Link className="dropdown-item" to="/profile">Profile</Link></li>
                                    {user.role === 'admin' && (
                                        <li><Link className="dropdown-item" to="/admin">Admin Dashboard</Link></li>
                                    )}
                                    <li><hr className="dropdown-divider" /></li>
                                    <li><button className="dropdown-item" onClick={handleLogout}>Logout</button></li>
                                </ul>
                            </li>
                        ) : (
                            <li className="nav-item">
                                <Link className="nav-link" to="/login">
                                    <span>Sign In</span>
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
