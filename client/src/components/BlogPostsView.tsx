import { useState } from "react";
import { id } from "@instantdb/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { BlogPost, QueryParams } from "../types/dashboard";
import db from "../lib/instant";

export default function BlogPostsView() {
    const [activePost, setActivePost] = useState<BlogPost | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        status: "draft" as BlogPost["status"],
    });

    // Query to get blog posts
    const { isLoading, error, data } = db.useQuery<QueryParams>({
        blogPosts: {},
    });

    if (isLoading) return <div className="p-4">Loading...</div>;
    if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;

    const blogPosts = Object.values(data.blogPosts || {}) as BlogPost[];

    // Handler for adding or updating a blog post
    const handleSavePost = () => {
        const now = new Date().toISOString();

        if (activePost?.id) {
            // Update existing post
            db.transact(
                db.tx.blogPosts[activePost.id].update({
                    title: formData.title || '',
                    content: formData.content || '',
                    status: formData.status,
                    lastEdited: now,
                    ...(formData.status === "published" && { publishedDate: now })
                })
            );
        } else {
            // Create new post
            const postId = id();
            db.transact(
                db.tx.blogPosts[postId].update({
                    title: formData.title || '',
                    content: formData.content || '',
                    status: formData.status,
                    lastEdited: now,
                    createdAt: now,
                    ...(formData.status === "published" && { publishedDate: now }),
                })
            );
        }

        handleCancel();
    };

    // Handler for publishing a draft
    const handlePublish = (post: BlogPost) => {
        db.transact(
            db.tx.blogPosts[post.id].update({
                status: "published",
                publishedDate: new Date().toISOString(),
                lastEdited: new Date().toISOString()
            })
        );
    };

    // Handler to edit a post
    const handleEdit = (post: BlogPost) => {
        setActivePost(post);
        setFormData({
            title: post.title,
            content: post.content,
            status: post.status,
        });
    };

    // Handler to cancel editing
    const handleCancel = () => {
        setActivePost(null);
        setFormData({
            title: "",
            content: "",
            status: "draft",
        });
    };

    // Handler to delete a post
    const handleDelete = (postId: string) => {
        if (window.confirm("Are you sure you want to delete this post?")) {
            db.transact(db.tx.blogPosts[postId].delete());
        }
    };

    // Create empty BlogPost object
    const createEmptyPost = (): BlogPost => ({
        id: '',
        title: '',
        content: '',
        status: 'draft',
        lastEdited: '',
        createdAt: '',
    });

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Blog Posts</h1>
                {!activePost && (
                    <Button onClick={() => setActivePost(createEmptyPost())}>+ New Post</Button>
                )}
            </div>

            {/* Edit/New Post Form */}
            {activePost !== null && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="space-x-2">
                            <Button variant="outline" onClick={handleCancel}>
                                Cancel
                            </Button>
                            <Button
                                variant="default"
                                onClick={handleSavePost}
                                disabled={!formData.title || !formData.content}
                            >
                                Save
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="status" className="text-sm">Status:</Label>
                            <select
                                id="status"
                                className="px-3 py-1.5 border rounded-md text-sm"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as BlogPost["status"] })}
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Title"
                            className="w-full border-none text-4xl font-bold mb-4 focus:outline-none focus:ring-0 p-0 placeholder:text-gray-300"
                            required
                        />
                    </div>

                    <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="Start writing..."
                        className="w-full min-h-[60vh] p-0 text-lg font-serif leading-relaxed border-none resize-none focus:outline-none focus:ring-0"
                    />
                </div>
            )}

            {/* Blog Posts List */}
            {activePost === null && (
                <div className="space-y-12">
                    {blogPosts.map((post) => (
                        <div key={post.id} className="border-b pb-8 last:border-b-0">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-3xl font-bold mb-2">{post.title}</h2>
                                <div className="flex gap-2 items-center">
                                    <Badge className={post.status === "draft" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>
                                        {post.status === "draft" ? "Draft" : "Published"}
                                    </Badge>
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(post)}>
                                        Edit
                                    </Button>
                                </div>
                            </div>
                            <div className="flex gap-6">
                                <div className="w-2/3">
                                    <div className="font-serif text-lg whitespace-pre-line">{post.content}</div>
                                </div>
                                <div className="w-1/3 text-sm space-y-4">
                                    <div>
                                        <p className="text-gray-500">Created</p>
                                        <p>{new Date(post.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Last edited</p>
                                        <p>{new Date(post.lastEdited).toLocaleDateString()}</p>
                                    </div>
                                    {post.publishedDate && (
                                        <div>
                                            <p className="text-gray-500">Published</p>
                                            <p>{new Date(post.publishedDate).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                    <div className="pt-4">
                                        {post.status === "draft" && (
                                            <Button variant="outline" size="sm" onClick={() => handlePublish(post)}>
                                                Publish
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" className="text-red-500 ml-2" onClick={() => handleDelete(post.id)}>
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {blogPosts.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">No blog posts yet. Create your first post to get started.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 