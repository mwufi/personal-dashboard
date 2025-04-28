import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from "./Sidebar";
import Overview from "./Overview";
import BooksView from "./BooksView";
import WaterIntakeView from "./WaterIntakeView";
import BlogPostsView from "./BlogPostsView";
import HabitsView from "./HabitsView";
import ProjectsView from "./ProjectsView";
import "./Dashboard.css";

export default function Dashboard() {
    const [searchParams] = useSearchParams();
    const defaultView = searchParams.get('view') || "overview";
    const [activeView, setActiveView] = useState(defaultView);

    // Update URL when active view changes
    useEffect(() => {
        const currentParams = new URLSearchParams(searchParams);
        currentParams.set('view', activeView);
        window.history.replaceState(null, '', `?${currentParams.toString()}`);
    }, [activeView, searchParams]);

    // Render the appropriate view based on activeView state
    const renderView = () => {
        switch (activeView) {
            case "overview":
                return <Overview />;
            case "projects":
                return <ProjectsView />;
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