import React from 'react';

const GeneratorIcon: React.FC = () => (
    <i className="bi bi-file-text-fill"></i>
);

const CollectionIcon: React.FC = () => (
    <i className="bi bi-bookmark-star-fill"></i>
);


interface NavbarProps {
    currentView: 'generator' | 'saved';
    setView: (view: 'generator' | 'saved') => void;
    savedCount: number;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView, savedCount }) => {
    return (
        <nav className="navbar navbar-expand bg-body-tertiary border-bottom sticky-top">
            <div className="container">
                <div className="mx-auto">
                    <ul className="nav nav-pills">
                        <li className="nav-item">
                            <button
                                onClick={() => setView('generator')}
                                className={`nav-link d-flex align-items-center gap-2 ${currentView === 'generator' ? 'active' : ''}`}
                                aria-current={currentView === 'generator' ? 'page' : undefined}
                            >
                                <GeneratorIcon />
                                Generator
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                onClick={() => setView('saved')}
                                className={`nav-link d-flex align-items-center gap-2 ${currentView === 'saved' ? 'active' : ''}`}
                                aria-current={currentView === 'saved' ? 'page' : undefined}
                            >
                                <CollectionIcon />
                                Saved Manuals
                                {savedCount > 0 && (
                                    <span className="badge rounded-pill text-bg-secondary">
                                        {savedCount}
                                    </span>
                                )}
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;