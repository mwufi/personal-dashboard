import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Play, Pause, Square, Edit, Trash, MoreHorizontal } from "lucide-react";
import db from "../lib/instant";
import { id } from "@instantdb/react";
import { Session } from "../types/dashboard";
import Timer from "./calendarView/Timer";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "./ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "./ui/alert-dialog";

export default function CalendarView() {
    const [activeSession, setActiveSession] = useState<Session | null>(null);
    const [sessionName, setSessionName] = useState("");
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [editingSession, setEditingSession] = useState<Session | null>(null);
    const [editingName, setEditingName] = useState("");
    const [editingProject, setEditingProject] = useState<string | null>(null);
    const [deleteSession, setDeleteSession] = useState<Session | null>(null);

    // Query data from InstantDB
    const { isLoading, error, data } = db.useQuery({
        sessions: {
            project: {}
        },
        projects: {}
    });

    console.log(data);

    // Start a new session
    const startSession = async () => {
        if (!sessionName) return;

        const sessionId = id();
        const txs = [
            db.tx.sessions[sessionId].update({
                name: sessionName,
                createdAt: new Date().toISOString(),
                paused: false,
                finishedAt: "",
            })
        ];

        // Add project link if selected
        if (selectedProject) {
            txs.push(db.tx.sessions[sessionId].link({ project: selectedProject }));
        }

        await db.transact(txs);
        setSessionName("");
    };

    // Pause or resume the active session
    const togglePauseSession = async () => {
        if (!activeSession) return;

        await db.transact(
            db.tx.sessions[activeSession.id].update({
                paused: !activeSession.paused,
            })
        );
    };

    // End the active session
    const endSession = async () => {
        if (!activeSession) return;

        await db.transact(
            db.tx.sessions[activeSession.id].update({
                finishedAt: new Date().toISOString(),
            })
        );

        setActiveSession(null);
    };

    // Resume a paused session
    const resumeSession = async (sessionId: string) => {
        // Set any currently active sessions to paused
        if (activeSession) {
            await db.transact(
                db.tx.sessions[activeSession.id].update({
                    paused: true,
                })
            );
        }

        // Resume the selected session
        await db.transact(
            db.tx.sessions[sessionId].update({
                paused: false,
            })
        );
    };

    // Open edit dialog and populate fields
    const openEditDialog = (session: any) => {
        setEditingSession(session as Session);
        setEditingName(session.name);
        setEditingProject(session.project?.[0]?.id || null);
    };

    // Save edited session
    const saveSession = async () => {
        if (!editingSession || !editingName) return;

        const txs = [
            db.tx.sessions[editingSession.id].update({
                name: editingName,
            })
        ];

        // Handle project changes
        if (editingSession.project?.[0]?.id !== editingProject) {
            // If there was a previous project, unlink it
            if (editingSession.project?.[0]?.id) {
                txs.push(db.tx.sessions[editingSession.id].unlink({ project: editingSession.project[0].id }));
            }

            // If a new project is selected, link it
            if (editingProject) {
                txs.push(db.tx.sessions[editingSession.id].link({ project: editingProject }));
            }
        }

        await db.transact(txs);
        setEditingSession(null);
    };

    // Delete session
    const confirmDeleteSession = async () => {
        if (!deleteSession) return;

        // If deleting the active session, clear active session
        if (activeSession?.id === deleteSession.id) {
            setActiveSession(null);
        }

        await db.transact(
            db.tx.sessions[deleteSession.id].delete()
        );

        setDeleteSession(null);
    };

    // Calculate elapsed time between two dates
    const getElapsedTime = (start: string, end: string): string => {
        const startTime = new Date(start).getTime();
        const endTime = new Date(end).getTime();
        const elapsedMs = endTime - startTime;

        // Convert to hours and minutes
        const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
        const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    };

    // Find active session when data is loaded
    useEffect(() => {
        if (data?.sessions && data.sessions.length > 0) {
            // Find first non-paused session
            const active = data.sessions.find(s => s && !s.paused);
            if (active) {
                setActiveSession(active as unknown as Session);
            }
        }
    }, [data]);


    if (isLoading) return <div className="p-4">Loading...</div>;
    if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;

    const todaySessions = data.sessions || [];

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold">Calendar</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Day View Card */}
                <Timer />

                {/* Pomodoro Session Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Work Session</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activeSession ? (
                            <div className="space-y-4">
                                <div className="flex flex-col space-y-2">
                                    <div className="font-semibold">{activeSession.name}</div>
                                    {activeSession.project && (
                                        <div className="text-sm text-muted-foreground">
                                            Project: {activeSession.project[0].name}
                                        </div>
                                    )}
                                    <div className="text-sm">
                                        Started: {new Date(activeSession.createdAt).toLocaleTimeString()}
                                    </div>
                                    <div className="text-sm">
                                        Status: {activeSession.paused ? 'Paused' : 'Active'}
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <Button
                                        variant={activeSession.paused ? "default" : "outline"}
                                        size="sm"
                                        onClick={togglePauseSession}
                                    >
                                        {activeSession.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                                        {activeSession.paused ? 'Resume' : 'Pause'}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={endSession}
                                    >
                                        <Square className="h-4 w-4 mr-1" />
                                        End
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex flex-col space-y-2">
                                    <input
                                        type="text"
                                        placeholder="Session name"
                                        className="p-2 border rounded-md"
                                        value={sessionName}
                                        onChange={e => setSessionName(e.target.value)}
                                    />
                                    <select
                                        className="p-2 border rounded-md"
                                        value={selectedProject || ""}
                                        onChange={e => setSelectedProject(e.target.value || null)}
                                    >
                                        <option value="">No Project</option>
                                        {data.projects && Array.isArray(data.projects) && data.projects.map(project => (
                                            <option key={project.id} value={project.id}>
                                                {(project as any).name || "Unnamed Project"}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <Button onClick={startSession} disabled={!sessionName}>
                                    <Play className="h-4 w-4 mr-1" />
                                    Start Session
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Today's Sessions */}
            <Card>
                <CardHeader>
                    <CardTitle>Today's Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                    {todaySessions.length === 0 ? (
                        <div className="text-center text-muted-foreground py-4">
                            No sessions today. Start one above!
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {todaySessions.map(session => (
                                <div
                                    key={session.id}
                                    className={`p-3 rounded-md border ${session.id === activeSession?.id
                                        ? 'border-primary'
                                        : 'border-border'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-medium">{session.name}</div>
                                            {session.project && (
                                                <div className="text-sm text-muted-foreground">
                                                    {session.project[0].name}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="text-right">
                                                <div className="text-sm">
                                                    {new Date(session.createdAt).toLocaleTimeString()}
                                                </div>
                                                <div className={`text-xs ${session.finishedAt
                                                    ? 'text-blue-500'
                                                    : session.paused
                                                        ? 'text-yellow-500'
                                                        : 'text-green-500'
                                                    }`}>
                                                    {session.finishedAt
                                                        ? `Completed - ${getElapsedTime(session.createdAt, session.finishedAt)}`
                                                        : session.paused
                                                            ? 'Paused'
                                                            : 'In Progress'}
                                                </div>
                                                {session.paused && !session.finishedAt && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="mt-1 h-6 text-xs"
                                                        onClick={() => resumeSession(session.id)}
                                                    >
                                                        <Play className="h-3 w-3 mr-1" />
                                                        Resume
                                                    </Button>
                                                )}
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => openEditDialog(session as Session)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => setDeleteSession(session as Session)}
                                                        className="cursor-pointer text-destructive"
                                                    >
                                                        <Trash className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Session Dialog */}
            <Dialog open={!!editingSession} onOpenChange={(isOpen: boolean) => !isOpen && setEditingSession(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Session</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <label htmlFor="session-name" className="text-sm font-medium">
                                    Session Name
                                </label>
                                <input
                                    id="session-name"
                                    type="text"
                                    className="p-2 border rounded-md"
                                    value={editingName}
                                    onChange={e => setEditingName(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="session-project" className="text-sm font-medium">
                                    Project
                                </label>
                                <select
                                    id="session-project"
                                    className="p-2 border rounded-md"
                                    value={editingProject || ""}
                                    onChange={e => setEditingProject(e.target.value || null)}
                                >
                                    <option value="">No Project</option>
                                    {data.projects && Array.isArray(data.projects) && data.projects.map(project => (
                                        <option key={project.id} value={project.id}>
                                            {(project as any).name || "Unnamed Project"}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingSession(null)}>
                            Cancel
                        </Button>
                        <Button onClick={saveSession} disabled={!editingName}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Session Confirmation */}
            <AlertDialog open={!!deleteSession} onOpenChange={(isOpen: boolean) => !isOpen && setDeleteSession(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Session</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this session? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteSession(null)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteSession} className="bg-destructive text-destructive-foreground">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
} 