import { BookOpenIcon, DropletIcon, PencilIcon, BarChartIcon, LayoutDashboardIcon, FolderKanbanIcon } from "lucide-react";
import { SidebarProps } from "../types/dashboard";
import { cn } from "../lib/utils";

const navItems = [
    {
        id: "overview",
        label: "Overview",
        icon: <LayoutDashboardIcon className="h-5 w-5" />,
    },
    {
        id: "projects",
        label: "Projects",
        icon: <FolderKanbanIcon className="h-5 w-5" />,
    },
    {
        id: "books",
        label: "Books",
        icon: <BookOpenIcon className="h-5 w-5" />,
    },
    {
        id: "water",
        label: "Water Intake",
        icon: <DropletIcon className="h-5 w-5" />,
    },
    {
        id: "blog",
        label: "Blog Posts",
        icon: <PencilIcon className="h-5 w-5" />,
    },
    {
        id: "habits",
        label: "Habit Tracker",
        icon: <BarChartIcon className="h-5 w-5" />,
    },
];

export default function Sidebar({ activeView, onSelectView }: SidebarProps) {
    return (
        <div className="h-full w-64 bg-secondary p-4 flex flex-col border-r">
            <div className="mb-8">
                <h2 className="text-2xl font-bold">Personal Dashboard</h2>
            </div>

            <nav className="space-y-1 flex-1">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        className={cn(
                            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                            activeView === item.id
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                        )}
                        onClick={() => onSelectView(item.id)}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="border-t pt-4 mt-auto">
                <div className="text-xs text-muted-foreground">
                    <p>Last synced: {new Date().toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
} 