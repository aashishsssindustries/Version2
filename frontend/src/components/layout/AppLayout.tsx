import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

import TopNavigationBar from './TopNavigationBar';
import SecondaryContextBar from './SecondaryContextBar';
import UtilityPanel from './UtilityPanel';
import './AppLayout.css';

const AppLayout: React.FC = () => {
    return (
        <div className="app-layout enterprise">
            {/* Global Header */}
            <Header />

            {/* Top Navigation Bar - Below Header */}
            <TopNavigationBar />

            {/* Secondary Context Bar - Portfolio & Date Range */}
            <SecondaryContextBar />

            {/* Main Content Wrapper - Horizontal Layout */}
            <div className="main-wrapper">
                {/* Left Sidebar - Existing */}


                {/* Center Content - Routes Render Here */}
                <main className="main-content">
                    <div className="content-container">
                        <Outlet />
                    </div>
                </main>

                {/* Right Utility Panel - New */}
                <UtilityPanel />
            </div>
        </div>
    );
};

export default AppLayout;
