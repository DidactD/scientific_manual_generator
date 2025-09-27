import React, { useState } from 'react';
import { login } from '../services/authService';
import type { User } from '../types';

interface LoginPageProps {
    onLoginSuccess: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email || !password) {
            setError("Both email and password are required.");
            return;
        }

        setIsLoading(true);
        try {
            const user = await login(email, password);
            onLoginSuccess(user);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 bg-body-tertiary">
            <div className="container" style={{ maxWidth: '420px' }}>
                <div className="text-center mb-4">
                     <i className="bi bi-book-half fs-1 text-primary"></i>
                    <h1 className="h3 fw-bold mt-2">Scientific Manual Generator</h1>
                    <p className="text-muted">Please sign in to continue</p>
                </div>
                <div className="card shadow-sm">
                    <div className="card-body p-4 p-md-5">
                        <form onSubmit={handleSubmit}>
                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}
                            <div className="form-floating mb-3">
                                <input
                                    type="email"
                                    className="form-control"
                                    id="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    required
                                />
                                <label htmlFor="email">Email address</label>
                            </div>
                            <div className="form-floating mb-4">
                                <input
                                    type="password"
                                    className="form-control"
                                    id="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    required
                                />
                                <label htmlFor="password">Password</label>
                            </div>
                            <button className="w-100 btn btn-lg btn-primary" type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Signing In...
                                    </>
                                ) : 'Sign In'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
