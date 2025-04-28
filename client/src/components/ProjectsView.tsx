import { useState, useEffect, useRef } from 'react';
import { id } from '@instantdb/react';
import { Project, ProjectNote } from '../types/dashboard';
import db from '../lib/instant';
import { MessageCircle, Heart, Repeat, Share, MoreHorizontal, PlusIcon, Trash2, ImageIcon, FolderIcon, UnlockIcon, LockIcon, Pin, PinOff, Music, Play, Pencil, Archive, X } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { uploadFile, getFileMetadata } from '../lib/fileService';

// Define interfaces for post data
interface Post extends ProjectNote {
    projectId: string;
    projectName: string;
    likeCount?: number;
    commentCount?: number;
    retweetCount?: number;
}

export default function ProjectsView() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const projectId = searchParams.get('id');

    const [activeProject, setActiveProject] = useState<string | null>(projectId);
    const [showNewForm, setShowNewForm] = useState(false);
    const [editingPost, setEditingPost] = useState<ProjectNote | null>(null);
    const [showProjectForm, setShowProjectForm] = useState(false);
    const [editingProject, setEditingProject] = useState<string | null>(null);

    // File input references
    const imageFileRef = useRef<HTMLInputElement>(null);
    const projectImageRef = useRef<HTMLInputElement>(null);

    // Query projects and their notes
    const { isLoading, error, data } = db.useQuery({
        projects: {
            projectNotes: {}
        }
    });

    // Set active project from URL or first project if available
    useEffect(() => {
        if (projectId) {
            setActiveProject(projectId);
        }
    }, [projectId]);

    // Update URL when active project changes
    useEffect(() => {
        if (activeProject) {
            setSearchParams({ id: activeProject });
        } else {
            setSearchParams({});
        }
    }, [activeProject, setSearchParams]);

    // Add file input change handlers
    useEffect(() => {
        const imageFile = document.getElementById('image-file') as HTMLInputElement;
        const imageFileNameDiv = document.getElementById('image-file-name');

        const handleImageFileChange = () => {
            if (imageFile?.files?.length && imageFileNameDiv) {
                imageFileNameDiv.textContent = `Selected: ${imageFile.files[0].name}`;
            }
        };

        imageFile?.addEventListener('change', handleImageFileChange);

        return () => {
            imageFile?.removeEventListener('change', handleImageFileChange);
        };
    }, [showNewForm]);

    if (isLoading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;
    if (error) return <div className="p-4 text-red-500">Error loading feed: {error.message}</div>;

    const { projects = [] } = data || {};
    const allPosts: Post[] = [];

    // Collect all posts (notes) from all projects
    projects.forEach((project: any) => {
        const projectPosts = project.projectNotes || [];
        projectPosts.forEach((note: any) => {
            allPosts.push({
                ...note,
                projectId: project.id,
                projectName: project.name
            });
        });
    });

    // Sort by creation date, newest first
    allPosts.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Create a new post
    const handleCreatePost = async (data: { content: string, files?: FileList }) => {
        if (!activeProject) return;

        let attachmentUrls: string[] = [];

        // Generate ID for the new post
        const newPostId = id();

        // Upload any new files
        if (data.files && data.files.length > 0) {
            try {
                const filePromises = Array.from(data.files).map(file => {
                    const path = `posts/${newPostId}/${Date.now()}-${file.name}`;
                    return uploadFile(file, path);
                });
                const uploadedUrls = await Promise.all(filePromises);
                attachmentUrls = [...attachmentUrls, ...uploadedUrls];
            } catch (error) {
                console.error('Error uploading files:', error);
            }
        }

        db.transact([
            db.tx.projectNotes[newPostId].update({
                content: data.content,
                attachmentUrls: attachmentUrls,
                isPinned: false,
                createdAt: new Date().toISOString(),
                likeCount: 0,
                retweetCount: 0,
                commentCount: 0
            }),
            db.tx.projects[activeProject].link({ projectNotes: newPostId })
        ]);
        setShowNewForm(false);
    };

    // Create a new project
    const handleCreateProject = async (data: { name: string, isPublic: boolean }) => {
        const newProjectId = id();

        db.transact(
            db.tx.projects[newProjectId].update({
                name: data.name,
                isPublic: data.isPublic,
                createdAt: new Date().toISOString()
            })
        );

        setShowProjectForm(false);
        setActiveProject(newProjectId);
    };

    // Update an existing project
    const handleUpdateProject = async (projectId: string, data: { name: string, isPublic: boolean }) => {
        db.transact(
            db.tx.projects[projectId].update({
                name: data.name,
                isPublic: data.isPublic
            })
        );

        setShowProjectForm(false);
        setEditingProject(null);
    };

    // Delete a project and all its notes
    const handleDeleteProject = (projectId: string) => {
        if (!projectId) return;

        // First get all notes for this project
        const project = projects.find((p: any) => p.id === projectId);
        const projectNoteIds = project?.projectNotes?.map((note: any) => note.id) || [];

        // Create transactions to delete all notes first
        const noteDeleteTransactions = projectNoteIds.map(noteId =>
            db.tx.projectNotes[noteId].delete()
        );

        // Then delete the project
        db.transact([
            ...noteDeleteTransactions,
            db.tx.projects[projectId].delete()
        ]);

        // Reset active project if we're deleting the active one
        if (activeProject === projectId) {
            setActiveProject(null);
        }
    };

    // Delete a post
    const handleDeletePost = (noteId: string) => {
        db.transact(db.tx.projectNotes[noteId].delete());
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

            if (diffInSeconds < 60) {
                return `${diffInSeconds}s`;
            } else if (diffInSeconds < 3600) {
                return `${Math.floor(diffInSeconds / 60)}m`;
            } else if (diffInSeconds < 86400) {
                return `${Math.floor(diffInSeconds / 3600)}h`;
            } else if (diffInSeconds < 604800) {
                return `${Math.floor(diffInSeconds / 86400)}d`;
            } else {
                return `${date.toLocaleDateString()}`;
            }
        } catch (e) {
            return dateString;
        }
    };

    // Toggle like on a post
    const toggleLike = (post: any) => {
        const currentLikes = post.likeCount || 0;
        const newLikes = currentLikes + 1; // In a real app, you'd toggle on/off

        db.transact(
            db.tx.projectNotes[post.id].update({
                likeCount: newLikes,
                // Preserve other fields
                content: post.content,
                attachmentUrls: post.attachmentUrls || [],
                isPinned: post.isPinned || false,
                retweetCount: post.retweetCount || 0,
                commentCount: post.commentCount || 0
            })
        );
    };

    // Render image attachments for a post
    const renderAttachments = (attachmentUrls: string[] = []) => {
        if (!attachmentUrls.length) return null;

        const isImage = (url: string) => url.match(/\.(jpeg|jpg|gif|png)$/i);
        const images = attachmentUrls.filter(url => isImage(url));

        if (images.length === 0) return null;

        return (
            <div className="mt-2 rounded-xl overflow-hidden border border-gray-200">
                <img
                    src={images[0]}
                    alt="Attached media"
                    className="w-full h-auto max-h-96 object-cover"
                />
            </div>
        );
    };

    // Create a soft pastel color for project avatar
    const getProjectColor = (projectId: string) => {
        const colors = [
            'bg-[#8da0cb]', 'bg-[#fc8d62]', 'bg-[#66c2a5]', 'bg-[#e78ac3]',
            'bg-[#a6d854]', 'bg-[#ffd92f]', 'bg-[#e5c494]', 'bg-[#b3b3b3]'
        ];
        // Use the projectId to deterministically choose a color
        const charSum = projectId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[charSum % colors.length];
    };

    // Get active project details
    const activeProjectDetails = projects.find((p: any) => p.id === activeProject);

    return (
        <div className="grid grid-cols-[250px_1fr] h-full bg-[#f5f5f7]">
            {/* Sidebar - Softer design */}
            <div className="bg-[#2d2d2d] p-4 overflow-auto border-r border-[#3d3d3d]">
                <div className="flex flex-col h-full">
                    <div className="flex items-center mb-8 px-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                            <Music className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold ml-2 text-white">Mindspace</h2>
                    </div>

                    <div className="space-y-2 mb-6">
                        <button
                            className={`w-full text-left px-4 py-3 rounded-md font-medium ${!activeProject ? 'bg-[#4a4a4a] text-white' : 'text-gray-300 hover:text-white hover:bg-[#3a3a3a]'}`}
                            onClick={() => setActiveProject(null)}
                        >
                            <div className="flex items-center">
                                <FolderIcon className="h-5 w-5 mr-3" />
                                <span>All Posts</span>
                            </div>
                        </button>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-4">Your Projects</h3>
                        <button
                            onClick={() => {
                                setEditingProject(null);
                                setShowProjectForm(true);
                            }}
                            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-[#3a3a3a]"
                        >
                            <PlusIcon className="h-4 w-4" />
                        </button>
                    </div>

                    {projects.length > 0 ? (
                        <div className="flex flex-col space-y-1 pr-2 mb-4">
                            {projects.map((project: any) => (
                                <div
                                    key={project.id}
                                    className={`group flex items-center text-left px-3 py-2 rounded-md ${activeProject === project.id ? 'bg-[#3a3a3a] text-white' : 'text-gray-300 hover:text-white hover:bg-[#3a3a3a]'}`}
                                >
                                    <button
                                        className="flex-1 flex items-center"
                                        onClick={() => setActiveProject(project.id)}
                                    >
                                        <div className={`w-8 h-8 ${getProjectColor(project.id)} rounded flex items-center justify-center flex-shrink-0`}>
                                            <span className="text-white font-medium">{project.name.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <div className="ml-3 truncate">
                                            <div className="font-medium">{project.name}</div>
                                            <div className="text-xs text-gray-400">{(project.projectNotes || []).length} posts</div>
                                        </div>
                                    </button>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex">
                                        <button
                                            onClick={() => {
                                                setEditingProject(project.id);
                                                setShowProjectForm(true);
                                            }}
                                            className="text-gray-400 hover:text-white p-1"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm(`Are you sure you want to delete "${project.name}"? This will delete all posts within it.`)) {
                                                    handleDeleteProject(project.id);
                                                }
                                            }}
                                            className="text-gray-400 hover:text-red-400 p-1"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm px-4 mb-4">No projects yet</p>
                    )}

                    <div className="mt-auto pt-4">
                        <button
                            onClick={() => {
                                setEditingProject(null);
                                setShowProjectForm(true);
                            }}
                            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-md py-2 font-medium hover:opacity-90 transition"
                        >
                            New Project
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content - Cleaner design */}
            <div className="bg-white overflow-auto">
                {/* Project form modal */}
                {showProjectForm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white w-full max-w-md rounded-lg shadow-lg overflow-hidden">
                            <div className="p-4 border-b flex justify-between items-center">
                                <h3 className="text-lg font-semibold">{editingProject ? 'Edit Project' : 'Create New Project'}</h3>
                                <button
                                    onClick={() => {
                                        setShowProjectForm(false);
                                        setEditingProject(null);
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-4">
                                <div className="mb-4">
                                    <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                                    <input
                                        type="text"
                                        id="project-name"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Enter project name"
                                        defaultValue={editingProject ? projects.find((p: any) => p.id === editingProject)?.name : ''}
                                    />
                                </div>

                                <div className="mb-6">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="project-public"
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            defaultChecked={editingProject ? projects.find((p: any) => p.id === editingProject)?.isPublic : false}
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Make this project public</span>
                                    </label>
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => {
                                            setShowProjectForm(false);
                                            setEditingProject(null);
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            const nameInput = document.getElementById('project-name') as HTMLInputElement;
                                            const isPublicInput = document.getElementById('project-public') as HTMLInputElement;

                                            if (!nameInput.value.trim()) {
                                                alert('Please enter a project name');
                                                return;
                                            }

                                            if (editingProject) {
                                                handleUpdateProject(editingProject, {
                                                    name: nameInput.value,
                                                    isPublic: isPublicInput.checked
                                                });
                                            } else {
                                                handleCreateProject({
                                                    name: nameInput.value,
                                                    isPublic: isPublicInput.checked
                                                });
                                            }
                                        }}
                                        className="px-4 py-2 bg-indigo-600 rounded-md text-sm font-medium text-white hover:bg-indigo-700"
                                    >
                                        {editingProject ? 'Save Changes' : 'Create Project'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Project header */}
                {activeProject && activeProjectDetails && (
                    <div className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white p-8">
                        <div className="max-w-[800px] mx-auto">
                            <div className="flex items-end space-x-6">
                                <div className={`w-32 h-32 ${getProjectColor(activeProject)} shadow-lg rounded-lg flex items-center justify-center`}>
                                    <span className="text-4xl font-bold text-white">{activeProjectDetails.name.charAt(0)}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs uppercase font-bold text-indigo-200">Project</div>
                                    <h1 className="text-4xl font-bold my-2">{activeProjectDetails.name}</h1>
                                    <div className="flex items-center text-sm space-x-4 mt-3">
                                        <div className="flex items-center">
                                            <span className="font-bold">{(activeProjectDetails.projectNotes || []).length}</span>
                                            <span className="ml-1 text-indigo-200">posts</span>
                                        </div>
                                        <div>
                                            {activeProjectDetails.isPublic ? (
                                                <span className="flex items-center px-2 py-1 bg-indigo-800/50 rounded-full text-xs">
                                                    Public
                                                </span>
                                            ) : (
                                                <span className="flex items-center px-2 py-1 bg-indigo-800/50 rounded-full text-xs">
                                                    Private
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => {
                                                setEditingProject(activeProject);
                                                setShowProjectForm(true);
                                            }}
                                            className="p-2 bg-indigo-800/50 rounded-full hover:bg-indigo-700/70"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm(`Are you sure you want to delete "${activeProjectDetails.name}"? This will delete all posts within it.`)) {
                                                    handleDeleteProject(activeProject);
                                                }
                                            }}
                                            className="p-2 bg-indigo-800/50 rounded-full hover:bg-red-700/70"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* What's on your mind box + Timeline */}
                <div className="max-w-[800px] mx-auto p-4">
                    {/* What's on your mind? box - Always present in project view */}
                    {activeProject && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
                            <div className="p-4">
                                <div className="flex">
                                    <div className="mr-3">
                                        <div className={`w-10 h-10 ${getProjectColor(activeProject)} rounded-full flex items-center justify-center`}>
                                            <span className="text-white font-bold">{activeProjectDetails?.name.charAt(0).toUpperCase()}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <textarea
                                            id="post-content"
                                            className="w-full p-2 text-lg border-0 focus:ring-0 focus:outline-none"
                                            placeholder="What's on your mind?"
                                            rows={2}
                                        ></textarea>
                                    </div>
                                </div>

                                <div id="image-file-name" className="text-xs ml-12 text-indigo-500"></div>

                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                    <div className="flex items-center">
                                        <button
                                            onClick={() => imageFileRef.current?.click()}
                                            className="text-gray-500 p-2 rounded-full hover:bg-gray-100"
                                        >
                                            <ImageIcon className="h-5 w-5" />
                                        </button>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            ref={imageFileRef}
                                            id="image-file"
                                        />
                                    </div>

                                    <button
                                        onClick={async () => {
                                            const contentInput = document.getElementById('post-content') as HTMLTextAreaElement;
                                            const filesInput = document.getElementById('image-file') as HTMLInputElement;

                                            if (!contentInput.value.trim()) {
                                                alert("Please enter some content for your post");
                                                return;
                                            }

                                            await handleCreatePost({
                                                content: contentInput.value,
                                                files: filesInput.files || undefined
                                            });

                                            // Clear the input after posting
                                            contentInput.value = '';
                                            if (filesInput) filesInput.value = '';
                                            const fileNameDiv = document.getElementById('image-file-name');
                                            if (fileNameDiv) fileNameDiv.textContent = '';
                                        }}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 font-medium text-sm"
                                    >
                                        Post
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* No active project state */}
                    {!activeProject && (
                        <div className="text-center py-8 mb-6">
                            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                                <FolderIcon className="h-10 w-10 text-indigo-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">Welcome to Mindspace</h2>
                            <p className="text-gray-500 mt-2 mb-6">Select a project from the sidebar or create a new one</p>
                            <button
                                onClick={() => {
                                    setEditingProject(null);
                                    setShowProjectForm(true);
                                }}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
                            >
                                Create Your First Project
                            </button>
                        </div>
                    )}

                    {/* Posts Feed */}
                    <div className="divide-y divide-gray-200">
                        {activeProject ? (
                            // Show posts from active project
                            allPosts
                                .filter(post => post.projectId === activeProject)
                                .map((post: Post) => (
                                    <div key={post.id} className="py-4">
                                        <div className="flex">
                                            <div className="mr-3">
                                                <div className={`w-10 h-10 ${getProjectColor(post.projectId)} rounded-full flex items-center justify-center`}>
                                                    <span className="text-white font-bold">{post.projectName.charAt(0).toUpperCase()}</span>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center">
                                                    <span className="font-bold mr-1">{post.projectName}</span>
                                                    <span className="text-gray-500 text-sm">· {formatDate(post.createdAt)}</span>
                                                    <div className="ml-auto">
                                                        <button
                                                            onClick={() => handleDeletePost(post.id)}
                                                            className="text-gray-400 hover:text-red-500 p-1"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="mt-1 whitespace-pre-wrap text-gray-800">{post.content}</p>
                                                {post.attachmentUrls && post.attachmentUrls.length > 0 && renderAttachments(post.attachmentUrls)}

                                                <div className="flex items-center space-x-6 mt-3 text-gray-500">
                                                    <button className="flex items-center text-gray-500 hover:text-blue-500">
                                                        <MessageCircle className="h-4 w-4 mr-1" />
                                                        <span className="text-xs">{post.commentCount || 0}</span>
                                                    </button>
                                                    <button className="flex items-center text-gray-500 hover:text-green-500">
                                                        <Repeat className="h-4 w-4 mr-1" />
                                                        <span className="text-xs">{post.retweetCount || 0}</span>
                                                    </button>
                                                    <button
                                                        className="flex items-center text-gray-500 hover:text-red-500"
                                                        onClick={() => toggleLike(post)}
                                                    >
                                                        <Heart className="h-4 w-4 mr-1" />
                                                        <span className="text-xs">{post.likeCount || 0}</span>
                                                    </button>
                                                    <button className="flex items-center text-gray-500 hover:text-blue-500">
                                                        <Share className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                        ) : (
                            // Show all posts in home feed
                            allPosts.map((post: Post) => (
                                <div key={post.id} className="py-4">
                                    <div className="flex">
                                        <div className="mr-3">
                                            <div className={`w-10 h-10 ${getProjectColor(post.projectId)} rounded-full flex items-center justify-center`}>
                                                <span className="text-white font-bold">{post.projectName.charAt(0).toUpperCase()}</span>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center">
                                                <span
                                                    className="font-bold mr-1 hover:text-indigo-600 cursor-pointer"
                                                    onClick={() => setActiveProject(post.projectId)}
                                                >
                                                    {post.projectName}
                                                </span>
                                                <span className="text-gray-500 text-sm">· {formatDate(post.createdAt)}</span>
                                            </div>
                                            <p className="mt-1 whitespace-pre-wrap text-gray-800">{post.content}</p>
                                            {post.attachmentUrls && post.attachmentUrls.length > 0 && renderAttachments(post.attachmentUrls)}

                                            <div className="flex items-center space-x-6 mt-3 text-gray-500">
                                                <button className="flex items-center text-gray-500 hover:text-blue-500">
                                                    <MessageCircle className="h-4 w-4 mr-1" />
                                                    <span className="text-xs">{post.commentCount || 0}</span>
                                                </button>
                                                <button className="flex items-center text-gray-500 hover:text-green-500">
                                                    <Repeat className="h-4 w-4 mr-1" />
                                                    <span className="text-xs">{post.retweetCount || 0}</span>
                                                </button>
                                                <button
                                                    className="flex items-center text-gray-500 hover:text-red-500"
                                                    onClick={() => toggleLike(post)}
                                                >
                                                    <Heart className="h-4 w-4 mr-1" />
                                                    <span className="text-xs">{post.likeCount || 0}</span>
                                                </button>
                                                <button className="flex items-center text-gray-500 hover:text-blue-500">
                                                    <Share className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

                        {allPosts.length === 0 && activeProject && (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                                <div className="w-16 h-16 mb-4 rounded-full bg-indigo-50 flex items-center justify-center">
                                    <MessageCircle className="h-8 w-8 text-indigo-500" />
                                </div>
                                <p className="text-lg font-medium text-gray-700">No posts yet</p>
                                <p className="text-sm text-gray-500 mt-1">Share your thoughts to get started</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 