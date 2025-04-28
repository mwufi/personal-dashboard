import { useState } from "react";
import { id } from "@instantdb/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Book, QueryParams } from "../types/dashboard";
import db from "../lib/instant";

interface BooksData extends QueryParams {
    books?: Book[];
}

export default function BooksView() {
    const [formVisible, setFormVisible] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        author: "",
        status: "to-read" as Book["status"],
        notes: "",
        coverUrl: "",
    });

    // Query to get books
    const { isLoading, error, data } = db.useQuery<BooksData>({
        books: {},
    });

    if (isLoading) return <div className="p-4">Loading...</div>;
    if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;

    const { books = [] } = data;

    // Handler for adding a new book
    const handleAddBook = () => {
        const bookId = id();
        db.transact(
            db.tx.books[bookId].update({
                ...formData,
                createdAt: new Date().toISOString(),
            })
        );
        setFormData({
            title: "",
            author: "",
            status: "to-read",
            notes: "",
            coverUrl: "",
        });
        setFormVisible(false);
    };

    // Handler for updating book status
    const handleUpdateStatus = (bookId: string, newStatus: Book["status"]) => {
        db.transact(
            db.tx.books[bookId].update({
                status: newStatus,
                ...(newStatus === "in-progress" && { startDate: new Date().toISOString() }),
                ...(newStatus === "completed" && { finishDate: new Date().toISOString() }),
            })
        );
    };

    // Status badge color helper
    const getStatusColor = (status: Book["status"]) => {
        switch (status) {
            case "to-read": return "bg-yellow-100 text-yellow-800";
            case "in-progress": return "bg-blue-100 text-blue-800";
            case "completed": return "bg-green-100 text-green-800";
            default: return "";
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">My Books</h1>
                <Button onClick={() => setFormVisible(!formVisible)}>
                    {formVisible ? "Cancel" : "+ Add Book"}
                </Button>
            </div>

            {/* Add Book Form */}
            {formVisible && (
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Book</CardTitle>
                        <CardDescription>Keep track of books you want to read or are currently reading</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Book title"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="author">Author</Label>
                            <Input
                                id="author"
                                value={formData.author}
                                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                placeholder="Book author"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <select
                                id="status"
                                className="w-full px-3 py-2 border rounded-md"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as Book["status"] })}
                            >
                                <option value="to-read">To Read</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <textarea
                                id="notes"
                                className="w-full px-3 py-2 border rounded-md"
                                rows={3}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Your notes about this book"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="coverUrl">Cover Image URL (optional)</Label>
                            <Input
                                id="coverUrl"
                                value={formData.coverUrl}
                                onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleAddBook} disabled={!formData.title || !formData.author}>
                            Add Book
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* Books Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {books.map((book) => (
                    <Card key={book.id} className="overflow-hidden flex flex-col">
                        {book.coverUrl && (
                            <div className="h-48 overflow-hidden">
                                <img
                                    src={book.coverUrl}
                                    alt={book.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => (e.currentTarget.style.display = "none")}
                                />
                            </div>
                        )}
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="line-clamp-1">{book.title}</CardTitle>
                                    <CardDescription>{book.author}</CardDescription>
                                </div>
                                <Badge className={getStatusColor(book.status)}>
                                    {book.status === "to-read" ? "To Read" :
                                        book.status === "in-progress" ? "Reading" : "Completed"}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {book.notes && <p className="text-sm line-clamp-3">{book.notes}</p>}
                            {book.startDate && (
                                <p className="text-xs mt-2">
                                    Started: {new Date(book.startDate).toLocaleDateString()}
                                </p>
                            )}
                            {book.finishDate && (
                                <p className="text-xs">
                                    Finished: {new Date(book.finishDate).toLocaleDateString()}
                                </p>
                            )}
                        </CardContent>
                        <CardFooter className="mt-auto">
                            <div className="flex gap-2">
                                {book.status === "to-read" && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleUpdateStatus(book.id, "in-progress")}
                                    >
                                        Start Reading
                                    </Button>
                                )}
                                {book.status === "in-progress" && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleUpdateStatus(book.id, "completed")}
                                    >
                                        Mark Complete
                                    </Button>
                                )}
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {books.length === 0 && !formVisible && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No books added yet. Click "Add Book" to get started.</p>
                </div>
            )}
        </div>
    );
} 