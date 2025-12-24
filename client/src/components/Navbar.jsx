import { Link, useNavigate } from 'react-router-dom';
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

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
            <div className="container">
                <Link className="navbar-brand" to="/">E-Com Portfolio</Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto">
                        <li className="nav-item">
                            <Link className="nav-link" to="/">Products</Link>
                        </li>
                        {user ? (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/cart">
                                        Cart {cartCount > 0 && <span className="badge bg-secondary ms-1">{cartCount}</span>}
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/my-orders">My Orders</Link>
                                </li>
                                {user.role === 'admin' && (
                                    <li className="nav-item">
                                        <Link className="nav-link" to="/admin">Admin</Link>
                                    </li>
                                )}
                                <li className="nav-item">
                                    <button className="btn btn-link nav-link" onClick={handleLogout}>Logout</button>
                                </li>
                                <li className="nav-item">
                                    <span className="nav-link disabled">Hi, {user.email}</span>
                                </li>
                                <li className="nav-item ms-2">
                                    <WalletConnect />
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/login">Login</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/register">Register</Link>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
