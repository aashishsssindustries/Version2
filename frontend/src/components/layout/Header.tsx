import React, { useState } from 'react';
import { User, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleSignOut = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <header className="header">
            <div className="header-content">
                <div className="header-logo">
                    <h1 className="logo-text">WealthMax</h1>
                </div>

                <div className="header-actions">
                    <div className="user-menu">
                        <button
                            className="user-avatar"
                            onClick={() => setShowDropdown(!showDropdown)}
                            aria-label="User menu"
                        >
                            <User size={20} />
                            <span className="user-name">{user.name || 'User'}</span>
                        </button>

                        {showDropdown && (
                            <div className="dropdown-menu">
                                <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                                    <User size={16} />
                                    My Profile
                                </Link>
                                <button className="dropdown-item" onClick={handleSignOut}>
                                    <LogOut size={16} />
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
