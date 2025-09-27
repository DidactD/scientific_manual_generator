import React from 'react';
import type { User } from '../types';

const BookIcon = () => (
    <i className="bi bi-book-half fs-2 text-primary"></i>
);

const ThemeToggler: React.FC<{ theme: 'light' | 'dark'; setTheme: (theme: 'light' | 'dark') => void }> = ({ theme, setTheme }) => {
    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <button
            onClick={toggleTheme}
            className="btn btn-outline-secondary border-0 p-2 rounded-circle lh-1"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? <i className="bi bi-moon-stars-fill fs-5"></i> : <i className="bi bi-sun-fill fs-5"></i>}
        </button>
    );
};


interface HeaderProps {
    setView: (view: 'generator' | 'saved' | 'models') => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    user: User;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ setView, theme, setTheme, user, onLogout }) => {
    return (
        <header className="text-center py-4 border-bottom bg-body-tertiary position-relative" style={{ zIndex: 1030 }}>
            <div className="d-flex align-items-center justify-content-center gap-3">
                <BookIcon />
                <h1 className="h2 fw-bold text-body-emphasis mb-0">
                    Scientific Manual Generator
                </h1>
            </div>
            <p className="mt-2 text-muted">
                Leverage AI to generate detailed medical manuals from the latest scientific literature.
            </p>
            <div className="position-absolute top-50 end-0 translate-middle-y d-flex align-items-center me-3 gap-2">
                <ThemeToggler theme={theme} setTheme={setTheme} />
                 <div className="dropdown">
                    <button className="btn btn-outline-secondary border-0 p-2 rounded-circle lh-1" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="User menu">
                        <i className="bi bi-person-circle fs-4"></i>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end">
                        <li><h6 className="dropdown-header">Signed in as<br/><strong className="text-body-emphasis">{user.name}</strong></h6></li>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                            <button className="dropdown-item d-flex align-items-center gap-2" onClick={() => setView('models')}>
                                <i className="bi bi-gear-fill"></i> API Models
                            </button>
                        </li>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                            <button className="dropdown-item text-danger d-flex align-items-center gap-2" onClick={onLogout}>
                                <i className="bi bi-box-arrow-right"></i> Logout
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </header>
    );
};

export default Header;
