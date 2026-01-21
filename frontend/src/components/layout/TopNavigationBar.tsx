import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, TrendingUp, MoreHorizontal, ChevronDown } from 'lucide-react';
import './TopNavigationBar.css';

interface NavItem {
    path: string;
    label: string;
    icon: React.ElementType;
    isDropdown?: boolean;
}

const TopNavigationBar: React.FC = () => {
    const location = useLocation();
    const [showMoreMenu, setShowMoreMenu] = React.useState(false);

    const primaryNavItems: NavItem[] = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/portfolio', label: 'Portfolio', icon: FileText },
        { path: '/marketplace', label: 'Markets', icon: TrendingUp },
        { path: '/calculators', label: 'Calculators', icon: LayoutDashboard },
        { path: '/risk-assessment', label: 'Risk Assessment', icon: FileText },
        { path: '/settings', label: 'Settings', icon: MoreHorizontal },
    ];

    const moreItems: NavItem[] = [];

    const isMoreActive = moreItems.some(item => location.pathname === item.path);

    return (
        <nav className="top-navigation-bar">
            <div className="top-nav-content">
                <ul className="top-nav-list">
                    {primaryNavItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <li key={item.path} className="top-nav-item">
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `top-nav-link ${isActive ? 'active' : ''}`
                                    }
                                >
                                    <Icon size={16} className="top-nav-icon" />
                                    <span>{item.label}</span>
                                </NavLink>
                            </li>
                        );
                    })}

                    {/* More Dropdown */}
                    {/* More Dropdown - Only show if there are items */}
                    {moreItems.length > 0 && (
                        <li className="top-nav-item more-dropdown">
                            <button
                                className={`top-nav-link dropdown-trigger ${isMoreActive ? 'active' : ''}`}
                                onClick={() => setShowMoreMenu(!showMoreMenu)}
                                onBlur={() => setTimeout(() => setShowMoreMenu(false), 150)}
                            >
                                <MoreHorizontal size={16} className="top-nav-icon" />
                                <span>More</span>
                                <ChevronDown size={14} className={`dropdown-arrow ${showMoreMenu ? 'open' : ''}`} />
                            </button>

                            {showMoreMenu && (
                                <div className="more-dropdown-menu">
                                    {moreItems.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <NavLink
                                                key={item.path}
                                                to={item.path}
                                                className={({ isActive }) =>
                                                    `more-dropdown-item ${isActive ? 'active' : ''}`
                                                }
                                                onClick={() => setShowMoreMenu(false)}
                                            >
                                                <Icon size={14} />
                                                <span>{item.label}</span>
                                            </NavLink>
                                        );
                                    })}
                                </div>
                            )}
                        </li>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default TopNavigationBar;
