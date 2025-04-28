import { useState } from 'react';
import Sidebar from "./Sidebar";
import Overview from "./Overview";
import BooksView from "./BooksView";
import WaterIntakeView from "./WaterIntakeView";
import BlogPostsView from "./BlogPostsView";
import HabitsView from "./HabitsView";
import "./Dashboard.css";

export default function Dashboard() {
    const [activeView, setActiveView] = useState("overview");

    // Render the appropriate view based on activeView state
    const renderView = () => {
        switch (activeView) {
            case "overview":
                return <Overview />;
            case "books":
                return <BooksView />;
            case "water":
                return <WaterIntakeView />;
            case "blog":
                return <BlogPostsView />;
            case "habits":
                return <HabitsView />;
            default:
                return <Overview />;
        }
    };

    return (
        <div className="dashboard h-screen flex">
            <Sidebar activeView={activeView} onSelectView={setActiveView} />
            <div className="dashboard-content flex-1 overflow-auto bg-background">
                {renderView()}
            </div>
        </div>
    );
} 