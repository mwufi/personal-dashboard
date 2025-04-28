import { useState } from "react";
import { id } from "@instantdb/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Habit, HabitCompletion, QueryParams } from "../types/dashboard";
import db from "../lib/instant";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";


export default function HabitsView() {
    const [habitFormVisible, setHabitFormVisible] = useState(false);
    const [completionFormVisible, setCompletionFormVisible] = useState(false);
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
    const [habitData, setHabitData] = useState({
        name: "",
        description: ""
    });
    const [completionData, setCompletionData] = useState({
        habitId: "",
        date: new Date().toISOString().split("T")[0],
        completed: true,
        notes: ""
    });

    // Query to get habits and completions
    const { isLoading, error, data } = db.useQuery({
        habits: {
            completions: {}
        },
    });

    if (isLoading) return <div className="p-4">Loading...</div>;
    if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;

    const { habits = [] } = data;

    // Generate calendar days for the current month
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Helper to format a date string YYYY-MM-DD
    const formatDateString = (year: number, month: number, day: number) => {
        return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    };

    // Check if a habit was completed on a specific day
    const isHabitCompletedOnDay = (habitId: string, day: number) => {
        const dateString = formatDateString(currentYear, currentMonth, day);
        return habits.some(
            (habit) => habit.id === habitId && habit.completions.some(
                (completion) => completion.date === dateString && completion.completed
            )
        );
    };

    // Handler for adding or updating a habit
    const handleSaveHabit = () => {
        if (editingHabit) {
            // Update existing habit
            db.transact(
                db.tx.habits[editingHabit.id].update({
                    name: habitData.name,
                    description: habitData.description
                })
            );
        } else {
            // Create new habit
            const newHabitId = id();
            db.transact(
                db.tx.habits[newHabitId].update({
                    name: habitData.name,
                    description: habitData.description,
                    createdAt: new Date().toISOString()
                })
            );
        }

        setHabitData({ name: "", description: "" });
        setEditingHabit(null);
        setHabitFormVisible(false);
    };

    // Handler for deleting a habit
    const handleDeleteHabit = (habitId: string) => {
        if (window.confirm("Are you sure you want to delete this habit and all its completions?")) {
            // Delete the habit
            db.transact(db.tx.habits[habitId].delete());
        }
    };

    // Handler for editing a habit
    const handleEditHabit = (habit: Habit) => {
        setEditingHabit(habit);
        setHabitData({
            name: habit.name,
            description: habit.description || ""
        });
        setHabitFormVisible(true);
    };

    // Handler for adding a completion
    const handleAddCompletion = () => {
        const completionId = id();
        db.transact(
            db.tx.habitCompletions[completionId].update({
                date: completionData.date,
                completed: completionData.completed,
                notes: completionData.notes,
                createdAt: new Date().toISOString()
            }).link({
                habit: completionData.habitId
            })
        );

        setCompletionData({
            habitId: "",
            date: new Date().toISOString().split("T")[0],
            completed: true,
            notes: ""
        });
        setCompletionFormVisible(false);
    };

    // Handler for toggling a habit completion
    const handleToggleHabit = (habitId: string, day: number) => {
        const dateString = formatDateString(currentYear, currentMonth, day);
        const habit = habits.find(habit => habit.id === habitId);
        const existingCompletion = habit?.completions?.find(
            completion => completion.date === dateString && completion.completed
        );

        if (existingCompletion) {
            // Toggle existing completion
            console.log("toggling", existingCompletion, "to", !existingCompletion.completed);
            db.transact(
                db.tx.habitCompletions[existingCompletion.id].delete()
            );
        } else {
            // Create new completion
            const completionId = id();
            db.transact(
                db.tx.habitCompletions[completionId].update({
                    date: dateString,
                    completed: true,
                    notes: "",
                    createdAt: new Date().toISOString()
                }).link({
                    habit: habitId
                })
            );
        }
    };

    // Function to get month name
    const getMonthName = (month: number) => {
        return new Date(0, month).toLocaleString('default', { month: 'long' });
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Habit Tracker</h1>
                <Button onClick={() => {
                    setEditingHabit(null);
                    setHabitData({ name: "", description: "" });
                    setHabitFormVisible(!habitFormVisible);
                }}>
                    {habitFormVisible ? "Cancel" : "+ Add Habit"}
                </Button>
            </div>

            {/* Add/Edit Habit Form */}
            {habitFormVisible && (
                <Card>
                    <CardHeader>
                        <CardTitle>{editingHabit ? "Edit Habit" : "Add New Habit"}</CardTitle>
                        <CardDescription>
                            {editingHabit ? "Update your habit details" : "Create a new habit to track daily"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="habitName">Habit Name</Label>
                            <Input
                                id="habitName"
                                value={habitData.name}
                                onChange={(e) => setHabitData({ ...habitData, name: e.target.value })}
                                placeholder="e.g., Morning Meditation"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description (optional)</Label>
                            <textarea
                                id="description"
                                className="w-full px-3 py-2 border rounded-md"
                                rows={2}
                                value={habitData.description}
                                onChange={(e) => setHabitData({ ...habitData, description: e.target.value })}
                                placeholder="Brief description of your habit"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" onClick={() => {
                            setHabitFormVisible(false);
                            setEditingHabit(null);
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveHabit} disabled={!habitData.name}>
                            {editingHabit ? "Update Habit" : "Add Habit"}
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* Month Header */}
            <div className="text-xl font-semibold">
                {getMonthName(currentMonth)} {currentYear}
            </div>

            {/* Manual Completion Form */}
            {completionFormVisible && (
                <Card>
                    <CardHeader>
                        <CardTitle>Record Habit Completion</CardTitle>
                        <CardDescription>Manually record a habit completion</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="habitId">Select Habit</Label>
                            <select
                                id="habitId"
                                className="w-full px-3 py-2 border rounded-md"
                                value={completionData.habitId}
                                onChange={(e) => setCompletionData({ ...completionData, habitId: e.target.value })}
                            >
                                <option value="">Select a habit</option>
                                {habits.map(habit => (
                                    <option key={habit.id} value={habit.id}>{habit.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="completionDate">Date</Label>
                            <Input
                                id="completionDate"
                                type="date"
                                value={completionData.date}
                                onChange={(e) => setCompletionData({ ...completionData, date: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                id="completed"
                                type="checkbox"
                                className="h-4 w-4"
                                checked={completionData.completed}
                                onChange={(e) => setCompletionData({ ...completionData, completed: e.target.checked })}
                            />
                            <Label htmlFor="completed">Completed</Label>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes (optional)</Label>
                            <textarea
                                id="notes"
                                className="w-full px-3 py-2 border rounded-md"
                                rows={2}
                                value={completionData.notes}
                                onChange={(e) => setCompletionData({ ...completionData, notes: e.target.value })}
                                placeholder="Any notes about this completion"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" onClick={() => setCompletionFormVisible(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddCompletion}
                            disabled={!completionData.habitId}
                        >
                            Save Completion
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* Habits Calendars */}
            {habits.length === 0 && !habitFormVisible && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No habits added yet. Click "Add Habit" to get started.</p>
                </div>
            )}

            {!habitFormVisible && !completionFormVisible && habits.length > 0 && (
                <Button
                    variant="outline"
                    onClick={() => setCompletionFormVisible(true)}
                    className="mb-4"
                >
                    Record Completion
                </Button>
            )}

            <div className="space-y-6">
                {habits.map((habit) => (
                    <Card key={habit.id}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle>{habit.name}</CardTitle>
                                {habit.description && (
                                    <CardDescription>{habit.description}</CardDescription>
                                )}
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Open menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditHabit(habit)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        <span>Edit</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => handleDeleteHabit(habit.id)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Delete</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent>
                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {/* Day headers */}
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                    <div key={day} className="text-center text-xs font-medium">
                                        {day}
                                    </div>
                                ))}

                                {/* Empty cells for days before the 1st of the month */}
                                {Array.from({ length: firstDayOfMonth }, (_, i) => (
                                    <div key={`empty-${i}`} className="h-8"></div>
                                ))}

                                {/* Calendar days */}
                                {calendarDays.map((day) => {
                                    const isCompleted = isHabitCompletedOnDay(habit.id, day);
                                    const isToday = day === today.getDate() && currentMonth === today.getMonth();
                                    return (
                                        <div
                                            key={day}
                                            className={`
                        h-8 flex items-center justify-center rounded-md cursor-pointer
                        ${isCompleted ? "bg-green-500 text-white" : "bg-gray-100"}
                        ${isToday ? "ring-2 ring-offset-1 ring-blue-500" : ""}
                      `}
                                            onClick={() => handleToggleHabit(habit.id, day)}
                                        >
                                            {day}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between">
                            <div>
                                {/* Calculate streak */}
                                {(() => {
                                    let streak = 0;
                                    let currentDate = new Date();

                                    while (true) {
                                        const dateStr = currentDate.toISOString().split('T')[0];
                                        const completed = habit.completions.some(
                                            completion => completion.date === dateStr &&
                                                completion.completed
                                        );

                                        if (completed) {
                                            streak++;
                                            currentDate.setDate(currentDate.getDate() - 1);
                                        } else {
                                            break;
                                        }
                                    }

                                    return streak > 0 ? (
                                        <Badge>Current streak: {streak} day{streak !== 1 ? 's' : ''}</Badge>
                                    ) : null;
                                })()}
                            </div>

                            {/* Completion rate */}
                            {(() => {
                                const thisMonthCompletions = habit.completions.filter(completion => {
                                    const completionDate = new Date(completion.date);
                                    return completionDate.getMonth() === currentMonth &&
                                        completionDate.getFullYear() === currentYear;
                                });

                                const completed = thisMonthCompletions.filter(completion => completion.completed).length;
                                const total = thisMonthCompletions.length;

                                return total > 0 ? (
                                    <div className="text-sm text-muted-foreground">
                                        {Math.round((completed / total) * 100)}% completion rate this month
                                    </div>
                                ) : null;
                            })()}
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
} 