import { useState } from "react";
import { id } from "@instantdb/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { BlogPost } from "../types/dashboard";
import db from "../lib/instant";

interface BlogData {
    blogPosts?: BlogPost[];
}

export default function BlogPostsView() {
    const [activePost, setActivePost] = useState<BlogPost | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        tags: "",
        status: "draft" as BlogPost["status"],
    });

    // Query to get blog posts
    const { isLoading, error, data } = db.useQuery<BlogData>({
        blogPosts: {},
    });

    if (isLoading) return <div className="p-4">Loading...</div>;
    if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;

    const { blogPosts = [] } = data;

    // Handler for adding or updating a blog post
    const handleSavePost = () => {
        const now = new Date().toISOString();

        if (activePost) {
            // Update existing post
            db.transact(
                db.tx.blogPosts[activePost.id].update({
                    title: formData.title,
                    content: formData.content,
                    tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
                    status: formData.status,
                    lastEdited: now,
                    ...(formData.status === "published" && { publishedDate: now }),
                })
            );
        } else {
            // Create new post
            const postId = id();
            db.transact(
                db.tx.blogPosts[postId].update({
                    title: formData.title,
                    content: formData.content,
                    tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
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
                lastEdited: new Date().toISOString(),
            })
        );
    };

    // Handler to edit a post
    const handleEdit = (post: BlogPost) => {
        setActivePost(post);
        setFormData({
            title: post.title,
            content: post.content,
            tags: post.tags ? post.tags.join(", ") : "",
            status: post.status,
        });
    };

    // Handler to cancel editing
    const handleCancel = () => {
        setActivePost(null);
        setFormData({
            title: "",
            content: "",
            tags: "",
            status: "draft",
        });
    };

    // Handler to delete a post
    const handleDelete = (postId: string) => {
        if (window.confirm("Are you sure you want to delete this post?")) {
            db.transact(db.tx.blogPosts[postId].delete());
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Blog Posts</h1>
                {!activePost && (
                    <Button onClick={() => setActivePost({} as BlogPost)}>+ New Post</Button>
                )}
            </div>

            {/* Edit/New Post Form */}
            {activePost !== null && (
                <Card>
                    <CardHeader>
                        <CardTitle>{activePost.id ? "Edit Post" : "New Post"}</CardTitle>
                        <CardDescription>Write your thoughts and ideas</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Post title"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="content">Content</Label>
                            <textarea
                                id="content"
                                className="w-full min-h-[200px] px-3 py-2 border rounded-md"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="Write your post content here..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tags">Tags (comma separated)</Label>
                            <Input
                                id="tags"
                                value={formData.tags}
                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                placeholder="tech, thoughts, learning"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <select
                                id="status"
                                className="w-full px-3 py-2 border rounded-md"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as BlogPost["status"] })}
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <div className="space-x-2">
                            <Button
                                variant="default"
                                onClick={handleSavePost}
                                disabled={!formData.title || !formData.content}
                            >
                                Save
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            )}

            {/* Blog Posts List */}
            {activePost === null && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {blogPosts.map((post) => (
                            <Card key={post.id}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="line-clamp-1">{post.title}</CardTitle>
                                        <Badge className={post.status === "draft" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>
                                            {post.status === "draft" ? "Draft" : "Published"}
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        Last edited: {new Date(post.lastEdited).toLocaleDateString()}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="line-clamp-3 text-sm mb-2">{post.content}</div>
                                    {post.tags && post.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {post.tags.map((tag) => (
                                                <Badge key={tag} variant="outline" className="text-xs">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="justify-between">
                                    <div className="text-xs text-muted-foreground">
                                        Created: {new Date(post.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(post)}>
                                            Edit
                                        </Button>
                                        {post.status === "draft" && (
                                            <Button variant="outline" size="sm" onClick={() => handlePublish(post)}>
                                                Publish
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(post.id)}>
                                            Delete
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>

                    {blogPosts.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">No blog posts yet. Create your first post to get started.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
} 