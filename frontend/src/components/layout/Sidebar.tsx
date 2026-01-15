import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calculator, Shield, ShoppingBag } from 'lucide-react';
import './Sidebar.css';

const Sidebar: React.FC = () => {
    const menuItems = [
        {
            path: '/dashboard',
            icon: LayoutDashboard,
            label: 'Dashboard',
        },
        {
            path: '/marketplace',
            icon: ShoppingBag,
            label: 'Marketplace',
        },
        {
            path: '/calculators',
            icon: Calculator,
            label: 'Calculators',
        },
        {
            path: '/risk-assessment',
            icon: Shield,
            label: 'Risk Assessment',
        },
    ];

    return (
        <aside className="sidebar">
            <nav className="sidebar-nav">
                <ul className="nav-list">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <li key={item.path} className="nav-item">
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `nav-link ${isActive ? 'active' : ''}`
                                    }
                                >
                                    <Icon size={20} className="nav-icon" />
                                    <span className="nav-label">{item.label}</span>
                                </NavLink>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;
