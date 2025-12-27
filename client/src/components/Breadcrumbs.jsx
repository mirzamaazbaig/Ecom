import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const Breadcrumbs = () => {
    const location = useLocation();

    // Split path into segments, remove empty strings
    const pathnames = location.pathname.split('/').filter((x) => x);

    // Don't show breadcrumbs on Home page (root)
    if (pathnames.length === 0) {
        return null;
    }

    return (
        <nav aria-label="breadcrumb" className="container mt-3">
            <ol className="breadcrumb">
                <li className="breadcrumb-item">
                    <Link to="/">Home</Link>
                </li>
                {pathnames.map((value, index) => {
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathnames.length - 1;

                    // Capitalize first letter
                    const name = value.charAt(0).toUpperCase() + value.slice(1);

                    return isLast ? (
                        <li key={to} className="breadcrumb-item active" aria-current="page">
                            {name}
                        </li>
                    ) : (
                        <li key={to} className="breadcrumb-item">
                            <Link to={to}>{name}</Link>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
