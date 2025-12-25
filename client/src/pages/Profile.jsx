import React from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const { user } = useAuth();

    if (!user) return <div className="container mt-5">Please log in to view your profile.</div>;

    return (
        <div className="container mt-5 fade-in">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card shadow-lg p-4">
                        <div className="card-body">
                            <h2 className="mb-4 text-center">User Profile</h2>
                            <div className="text-center mb-4">
                                <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                                    {user.email[0].toUpperCase()}
                                </div>
                            </div>
                            <div className="list-group list-group-flush mt-4">
                                <div className="list-group-item d-flex justify-content-between align-items-center">
                                    <strong>Email:</strong>
                                    <span>{user.email}</span>
                                </div>
                                <div className="list-group-item d-flex justify-content-between align-items-center">
                                    <strong>Role:</strong>
                                    <span className="badge bg-info text-dark">{user.role}</span>
                                </div>
                                <div className="list-group-item d-flex justify-content-between align-items-center">
                                    <strong>Account Status:</strong>
                                    <span className="text-success">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
