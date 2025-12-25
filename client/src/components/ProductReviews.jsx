import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const ProductReviews = ({ productId }) => {
    const [reviews, setReviews] = useState([]);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, [productId]);

    const fetchReviews = async () => {
        try {
            const { data } = await api.get(`/reviews/${productId}`);
            setReviews(data);
        } catch (error) {
            console.error('Error fetching reviews', error);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/reviews', {
                product_id: productId,
                rating: newRating,
                comment: newComment
            });
            setNewComment('');
            fetchReviews();
            alert('Review submitted!');
        } catch (error) {
            alert('Failed to submit review. You might need to login.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-5">
            <h3>Customer Reviews</h3>
            <hr />
            <div className="row">
                <div className="col-md-6">
                    {reviews.length === 0 ? <p>No reviews yet.</p> : (
                        reviews.map(review => (
                            <div key={review.id} className="mb-3 card p-3">
                                <div className="d-flex justify-content-between">
                                    <strong>{review.email ? review.email.split('@')[0] : 'User'}</strong>
                                    <span className="text-warning">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                                </div>
                                <p className="mt-2 text-muted">{new Date(review.created_at).toLocaleDateString()}</p>
                                <p>{review.comment}</p>
                            </div>
                        ))
                    )}
                </div>

                <div className="col-md-6">
                    <div className="card p-4 bg-light">
                        <h5>Write a Review</h5>
                        <form onSubmit={handleSubmitReview}>
                            <div className="mb-3">
                                <label className="form-label">Rating</label>
                                <select className="form-select" value={newRating} onChange={(e) => setNewRating(parseInt(e.target.value))}>
                                    <option value="5">5 - Excellent</option>
                                    <option value="4">4 - Very Good</option>
                                    <option value="3">3 - Good</option>
                                    <option value="2">2 - Fair</option>
                                    <option value="1">1 - Poor</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Comment</label>
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductReviews;
