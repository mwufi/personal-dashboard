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
        headerImgUrl: "",
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
                    headerImgUrl: formData.headerImgUrl || '',
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
                    headerImgUrl: formData.headerImgUrl || '',
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
            headerImgUrl: post.headerImgUrl || '',
        });
    };

    // Handler to cancel editing
    const handleCancel = () => {
        setActivePost(null);
        setFormData({
            title: "",
            content: "",
            status: "draft",
            headerImgUrl: "",
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

    // Format date to be more readable
    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

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

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="headerImgUrl" className="text-sm text-gray-500">Header Image URL</Label>
                            <Input
                                id="headerImgUrl"
                                value={formData.headerImgUrl}
                                onChange={(e) => setFormData({ ...formData, headerImgUrl: e.target.value })}
                                placeholder="https://example.com/image.jpg"
                                className="w-full text-sm"
                            />
                        </div>

                        {formData.headerImgUrl && (
                            <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                                <img
                                    src={formData.headerImgUrl}
                                    alt="Header"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).onerror = null;
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=Invalid+Image+URL';
                                    }}
                                />
                            </div>
                        )}

                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Title"
                            className="w-full border-none md:text-4xl font-bold mb-4 focus:outline-none focus:ring-0 p-0 placeholder:text-gray-300 md:py-4 min-h-16"
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

            {/* Blog Posts List - Substack Style */}
            {activePost === null && (
                <div>
                    {/* Featured Post (first published) */}
                    {blogPosts.filter(post => post.status === "published").length > 0 && (
                        <div className="mb-16">
                            {(() => {
                                const featuredPost = [...blogPosts]
                                    .filter(post => post.status === "published")
                                    .sort((a, b) => new Date(b.publishedDate || 0).getTime() - new Date(a.publishedDate || 0).getTime())[0];

                                return (
                                    <div key={featuredPost.id} className="cursor-pointer" onClick={() => handleEdit(featuredPost)}>
                                        {featuredPost.headerImgUrl && (
                                            <div className="relative w-full h-80 mb-6 bg-gray-100 rounded-lg overflow-hidden">
                                                <img
                                                    src={featuredPost.headerImgUrl}
                                                    alt={featuredPost.title}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).onerror = null;
                                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=Image+Not+Found';
                                                    }}
                                                />
                                            </div>
                                        )}
                                        <h2 className="text-4xl font-bold mb-3">{featuredPost.title}</h2>
                                        <p className="text-lg font-serif mb-4 line-clamp-3">{featuredPost.content}</p>
                                        <div className="flex justify-between items-center">
                                            <p className="text-gray-500">
                                                {formatDate(featuredPost.publishedDate || featuredPost.createdAt)}
                                            </p>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="sm" onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(featuredPost);
                                                }}>
                                                    Edit
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-red-500" onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(featuredPost.id);
                                                }}>
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* Other Posts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
                        {blogPosts
                            .filter(post => {
                                // If we have a featured post, exclude it from this list
                                if (blogPosts.filter(p => p.status === "published").length > 0) {
                                    const featuredPostId = [...blogPosts]
                                        .filter(p => p.status === "published")
                                        .sort((a, b) => new Date(b.publishedDate || 0).getTime() - new Date(a.publishedDate || 0).getTime())[0].id;
                                    return post.id !== featuredPostId;
                                }
                                return true;
                            })
                            .sort((a, b) => {
                                // First sort by status (published first)
                                if (a.status === "published" && b.status !== "published") return -1;
                                if (a.status !== "published" && b.status === "published") return 1;

                                // Then by date
                                const dateA = a.status === "published" ? a.publishedDate : a.lastEdited;
                                const dateB = b.status === "published" ? b.publishedDate : b.lastEdited;
                                return new Date(dateB || 0).getTime() - new Date(dateA || 0).getTime();
                            })
                            .map(post => (
                                <div key={post.id} className="cursor-pointer" onClick={() => handleEdit(post)}>
                                    {post.headerImgUrl && (
                                        <div className="relative w-full h-48 mb-4 bg-gray-100 rounded-lg overflow-hidden">
                                            <img
                                                src={post.headerImgUrl}
                                                alt={post.title}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).onerror = null;
                                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Image+Not+Found';
                                                }}
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge className={post.status === "draft" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>
                                            {post.status === "draft" ? "Draft" : "Published"}
                                        </Badge>
                                        <span className="text-sm text-gray-500">
                                            {formatDate(post.status === "published" ? post.publishedDate || "" : post.lastEdited)}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold mb-2 line-clamp-2">{post.title}</h3>
                                    <p className="text-gray-700 font-serif mb-3 line-clamp-3">{post.content}</p>

                                    <div className="flex justify-end gap-2">
                                        {post.status === "draft" && (
                                            <Button variant="outline" size="sm" onClick={(e) => {
                                                e.stopPropagation();
                                                handlePublish(post);
                                            }}>
                                                Publish
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" className="text-red-500" onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(post.id);
                                        }}>
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))}
                    </div>

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