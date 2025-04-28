import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { BookOpenIcon, DropletIcon, PencilIcon } from "lucide-react";
import { Progress } from "./ui/progress";
import db from "../lib/instant";
import { Book, BlogPost, WaterIntake, Habit, HabitCompletion, QueryParams } from "../types/dashboard";

interface OverviewData extends QueryParams {
    books?: Book[];
    blogPosts?: BlogPost[];
    waterIntakes?: WaterIntake[];
    habits?: Habit[];
    habitCompletions?: HabitCompletion[];
}

export default function Overview() {
    const [stats, setStats] = useState({
        booksReading: 0,
        booksCompleted: 0,
        waterToday: 0,
        blogDrafts: 0,
        habitCompletion: 0,
    });

    // Query our data
    const { isLoading, error, data } = db.useQuery<OverviewData>({
        books: {},
        blogPosts: {},
        waterIntakes: {},
        habits: {},
        habitCompletions: {},
    });

    // Calculate statistics for the overview
    useEffect(() => {
        if (data) {
            const { books = [], blogPosts = [], waterIntakes = [], habits = [], habitCompletions = [] } = data;

            // Calculate books stats
            const booksReading = books.filter(b => b.status === 'in-progress').length;
            const booksCompleted = books.filter(b => b.status === 'completed').length;

            // Calculate today's water intake
            const today = new Date().toISOString().split('T')[0];
            const waterToday = waterIntakes
                .filter(w => w.date === today)
                .reduce((sum, intake) => sum + intake.amount, 0);

            // Count blog drafts
            const blogDrafts = blogPosts.filter(p => p.status === 'draft').length;

            // Calculate habit completion rate for last 7 days
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i);
                return date.toISOString().split('T')[0];
            });

            const habitEvents = habitCompletions.filter(h => last7Days.includes(h.date));
            const completedHabits = habitEvents.filter(h => h.completed).length;
            const habitCompletion = habitEvents.length > 0
                ? Math.round((completedHabits / habitEvents.length) * 100)
                : 0;

            setStats({
                booksReading,
                booksCompleted,
                waterToday,
                blogDrafts,
                habitCompletion,
            });
        }
    }, [data]);

    if (isLoading) return <div className="p-4">Loading...</div>;
    if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;

    // Helper to generate the contribution grid
    const generateContributionGrid = () => {
        const { habitCompletions = [] } = data;
        const today = new Date();
        const cells = [];

        // Generate last 12 weeks (84 days)
        for (let i = 83; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dayHabits = habitCompletions.filter(h => h.date === dateStr);
            const completedCount = dayHabits.filter(h => h.completed).length;

            let intensity = "bg-gray-100";
            if (completedCount > 0) {
                if (completedCount >= 3) intensity = "bg-green-500";
                else if (completedCount >= 2) intensity = "bg-green-400";
                else intensity = "bg-green-300";
            }

            cells.push(
                <div
                    key={dateStr}
                    className={`w-3 h-3 rounded-sm ${intensity}`}
                    title={`${dateStr}: ${completedCount} habits completed`}
                />
            );
        }

        return cells;
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold">Dashboard Overview</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Reading</CardTitle>
                        <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.booksReading}</div>
                        <p className="text-xs text-muted-foreground">Books in progress</p>
                        <div className="mt-2 text-sm">{stats.booksCompleted} books completed</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Water Intake</CardTitle>
                        <DropletIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.waterToday} ml</div>
                        <p className="text-xs text-muted-foreground">Today's intake</p>
                        <div className="mt-2">
                            <Progress value={(stats.waterToday / 2500) * 100} className="h-2" />
                            <p className="text-xs text-right mt-1">{Math.round((stats.waterToday / 2500) * 100)}% of daily goal</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Blog Posts</CardTitle>
                        <PencilIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.blogDrafts}</div>
                        <p className="text-xs text-muted-foreground">Draft posts</p>
                        <div className="mt-2 text-sm">
                            {data.blogPosts?.filter(p => p.status === 'published').length || 0} published posts
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Contribution Grid */}
            <Card className="col-span-full">
                <CardHeader>
                    <CardTitle>Habit Contribution Graph</CardTitle>
                    <CardDescription>Your habit completion over the last 12 weeks</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-1">
                        {generateContributionGrid()}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                        <div>Overall completion rate: {stats.habitCompletion}%</div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs">Less</span>
                            <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
                            <div className="w-3 h-3 bg-green-300 rounded-sm"></div>
                            <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
                            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                            <span className="text-xs">More</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 