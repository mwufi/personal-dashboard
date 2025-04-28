import { useState } from "react";
import { id } from "@instantdb/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Label } from "./ui/label";
import { WaterIntake, QueryParams } from "../types/dashboard";
import db from "../lib/instant";

interface WaterData extends QueryParams {
    waterIntakes?: WaterIntake[];
}

export default function WaterIntakeView() {
    const [formData, setFormData] = useState({
        amount: 250, // Default to 250ml
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].slice(0, 5),
    });

    // Query to get water intake data
    const { isLoading, error, data } = db.useQuery<WaterData>({
        waterIntakes: {},
    });

    if (isLoading) return <div className="p-4">Loading...</div>;
    if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;

    const { waterIntakes = [] } = data;

    // Calculate today's water intake
    const today = new Date().toISOString().split('T')[0];
    const todayIntakes = waterIntakes.filter(intake => intake.date === today);
    const todayTotal = todayIntakes.reduce((sum, intake) => sum + intake.amount, 0);
    const dailyGoal = 2500; // 2.5 liters
    const progressPercentage = Math.min(100, Math.round((todayTotal / dailyGoal) * 100));

    // Get last 7 days of intake data for the chart
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
    }).reverse();

    const dailyIntakeByDate = last7Days.map(date => {
        const dayIntakes = waterIntakes.filter(intake => intake.date === date);
        const total = dayIntakes.reduce((sum, intake) => sum + intake.amount, 0);
        return {
            date,
            total,
            percentage: Math.min(100, Math.round((total / dailyGoal) * 100)),
        };
    });

    // Handler for adding water intake
    const handleAddWaterIntake = () => {
        const intakeId = id();
        db.transact(
            db.tx.waterIntakes[intakeId].update({
                ...formData,
                createdAt: new Date().toISOString(),
            })
        );
        // Reset the form to default values but keep the current date/time
        setFormData({
            amount: 250,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0].slice(0, 5),
        });
    };

    // Quick add buttons
    const quickAddOptions = [
        { label: "Glass (250ml)", amount: 250 },
        { label: "Bottle (500ml)", amount: 500 },
        { label: "Large Bottle (1L)", amount: 1000 },
    ];

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold">Water Intake Tracker</h1>

            {/* Today's Progress */}
            <Card>
                <CardHeader>
                    <CardTitle>Today's Progress</CardTitle>
                    <CardDescription>Goal: {dailyGoal}ml ({dailyGoal / 1000}L)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-sm font-medium">{todayTotal}ml consumed</span>
                            <span className="text-sm font-medium">{progressPercentage}%</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                        <div className="text-sm text-muted-foreground">
                            {todayTotal >= dailyGoal
                                ? "Great job! You've reached your daily goal."
                                : `${dailyGoal - todayTotal}ml left to reach your goal`}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Add */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Add</CardTitle>
                    <CardDescription>Log your water intake quickly</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {quickAddOptions.map((option) => (
                            <Button
                                key={option.amount}
                                variant="outline"
                                onClick={() => {
                                    setFormData({ ...formData, amount: option.amount });
                                    handleAddWaterIntake();
                                }}
                            >
                                + {option.label}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Custom Add Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Custom Amount</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (ml)</Label>
                            <Input
                                id="amount"
                                type="number"
                                min="10"
                                max="2000"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="time">Time</Label>
                                <Input
                                    id="time"
                                    type="time"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleAddWaterIntake}
                            disabled={formData.amount <= 0}
                        >
                            Add Entry
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Weekly Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>7-Day History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-7 gap-1 h-40">
                        {dailyIntakeByDate.map((day) => (
                            <div key={day.date} className="flex flex-col items-center">
                                <div className="flex-1 w-full flex items-end">
                                    <div
                                        className="w-full bg-blue-500/80 rounded-t"
                                        style={{ height: `${day.percentage}%` }}
                                        title={`${day.total}ml`}
                                    ></div>
                                </div>
                                <div className="text-xs mt-1 font-medium">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                <div className="text-xs text-muted-foreground">{day.total}ml</div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Entries */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Entries</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="divide-y">
                        {todayIntakes.length === 0 ? (
                            <p className="text-center py-4 text-muted-foreground">No entries logged today</p>
                        ) : (
                            todayIntakes
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .slice(0, 5)
                                .map((intake) => (
                                    <div key={intake.id} className="py-3 flex justify-between">
                                        <div>
                                            <div className="font-medium">{intake.amount}ml</div>
                                            <div className="text-xs text-muted-foreground">
                                                {intake.time}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => {
                                                db.transact(db.tx.waterIntakes[intake.id].delete());
                                            }}
                                        >
                                            <span className="sr-only">Delete</span>
                                            <span className="text-red-500">×</span>
                                        </Button>
                                    </div>
                                ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 