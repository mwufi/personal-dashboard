import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Clock } from "lucide-react";
import { Progress } from "../ui/progress";

// Format time to display
const formatTime = (hours: number, minutes: number, seconds: number) => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default function Timer() {
    const [timeLeft, setTimeLeft] = useState({
        hours: 0,
        minutes: 0,
        seconds: 0,
        percent: 100,
    });

    // Calculate time left in the day
    useEffect(() => {
        const updateTimeLeft = () => {
            const now = new Date();
            const endOfDay = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                23,
                59,
                59
            );

            const totalSeconds = Math.floor((endOfDay.getTime() - now.getTime()) / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            // Calculate percentage of day left
            const totalSecondsInDay = 24 * 60 * 60;
            const secondsElapsed = totalSecondsInDay - totalSeconds;
            const percentElapsed = (secondsElapsed / totalSecondsInDay) * 100;
            const percentLeft = 100 - percentElapsed;

            setTimeLeft({
                hours,
                minutes,
                seconds,
                percent: percentLeft,
            });
        };

        updateTimeLeft();
        const intervalId = setInterval(updateTimeLeft, 1000);
        return () => clearInterval(intervalId);
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Clock className="mr-2 h-5 w-5" />
                    Day View
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center space-y-4">
                    <div className="text-4xl font-bold">
                        {formatTime(timeLeft.hours, timeLeft.minutes, timeLeft.seconds)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Time left in the day
                    </div>
                    <div className="w-full">
                        <Progress value={timeLeft.percent} className="h-2" />
                        <p className="text-xs text-right mt-1">
                            {Math.round(timeLeft.percent)}% of day remaining
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}