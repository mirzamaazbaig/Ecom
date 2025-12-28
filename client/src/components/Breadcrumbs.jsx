import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../api/axios';

const Breadcrumbs = () => {
    const location = useLocation();
    const [productName, setProductName] = useState(null);

    // Split path into segments, remove empty strings
    const pathnames = location.pathname.split('/').filter((x) => x);

    // Don't show breadcrumbs on Home page (root)
    if (pathnames.length === 0) {
        return null;
    }

    // Fetch product name if on product details page
    useEffect(() => {
        const fetchProductName = async () => {
            // Check if we're on a product details page (e.g., /products/4)
            if (pathnames[0] === 'products' && pathnames[1]) {
                try {
                    const { data } = await api.get(`/products/${pathnames[1]}`);
                    setProductName(data.name);
                } catch (error) {
                    console.error('Failed to fetch product name for breadcrumb', error);
                }
            }
        };
        fetchProductName();
    }, [location.pathname]);

    return (
        <nav aria-label="breadcrumb" className="container mt-3" style={{ userSelect: 'none' }}>
            <ol className="breadcrumb">
                <li className="breadcrumb-item">
                    <Link to="/">Home</Link>
                </li>
                {pathnames.map((value, index) => {
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathnames.length - 1;

                    // Determine display name
                    let displayName = value.charAt(0).toUpperCase() + value.slice(1);

                    // If this is a product ID (numeric) and we have the product name, use it
                    if (pathnames[index - 1] === 'products' && productName) {
                        displayName = productName;
                    }

                    return isLast ? (
                        <li key={to} className="breadcrumb-item active" aria-current="page">
                            <span>{displayName}</span>
                        </li>
                    ) : (
                        <li key={to} className="breadcrumb-item">
                            <Link to={to}>{displayName}</Link>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
