import { useState, useEffect, useRef } from 'react';
import { id } from '@instantdb/react';
import { Project, ProjectNote } from '../types/dashboard';
import db from '../lib/instant';
import { MessageCircle, Heart, Repeat, Share, MoreHorizontal, PlusIcon, Trash2, ImageIcon, FolderIcon, Music, Play, Pencil, Archive, X } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { uploadFile, getFileMetadata } from '../lib/fileService';

import ProjectHeader from './project/ProjectHeader';
import ProjectSidebar from './project/ProjectSidebar';
import PostComposer from './project/PostComposer';
import PostItem from './project/PostItem';
import ProjectForm from './project/ProjectForm';

// Define interfaces for post data
interface Post extends ProjectNote {
    projectId: string;
    projectName: string;
    likeCount?: number;
    commentCount?: number;
    retweetCount?: number;
}

// Define gradient types
export interface GradientBackground {
    type: 'gradient';
    from: string;
    to: string;
}

// Enhanced Project type with our additional fields
export interface EnhancedProject extends Project {
    projectNotes?: any[];
    headerBackground?: GradientBackground;
}

// Predefined gradients
export const GRADIENTS = [
    { from: '#ffefba', to: '#ffffff' }, // Soft peach
    { from: '#e0f7fa', to: '#bbdefb' }, // Light blue
    { from: '#e8f5e9', to: '#dcedc8' }, // Mint green
    { from: '#f3e5f5', to: '#e1bee7' }, // Lavender
    { from: '#fff9c4', to: '#fff59d' }, // Light yellow
    { from: '#ffebee', to: '#ffcdd2' }  // Light pink
];

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
    };

    // Create a new project
    const handleCreateProject = async (data: { name: string, isPublic: boolean }) => {
        const newProjectId = id();

        // Select a random gradient for the project header
        const randomGradient = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
        const headerBackground: GradientBackground = {
            type: 'gradient',
            from: randomGradient.from,
            to: randomGradient.to
        };

        db.transact(
            db.tx.projects[newProjectId].update({
                name: data.name,
                isPublic: data.isPublic,
                createdAt: new Date().toISOString(),
                headerBackground
            })
        );

        setShowProjectForm(false);
        setActiveProject(newProjectId);
    };

    // Update an existing project
    const handleUpdateProject = async (projectId: string, data: { name: string, isPublic: boolean, headerBackground?: GradientBackground }) => {
        const currentProject = projects.find((p: any) => p.id === projectId);
        const headerBackground = data.headerBackground || currentProject?.headerBackground || {
            type: 'gradient',
            from: GRADIENTS[0].from,
            to: GRADIENTS[0].to
        };

        db.transact(
            db.tx.projects[projectId].update({
                name: data.name,
                isPublic: data.isPublic,
                headerBackground
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
    const activeProjectDetails = projects.find((p: any) => p.id === activeProject) as EnhancedProject | undefined;

    return (
        <div className="grid grid-cols-[300px_1fr] h-full bg-[#f5f5f7]">
            {/* Sidebar Component */}
            <ProjectSidebar
                projects={projects}
                activeProject={activeProject}
                setActiveProject={setActiveProject}
                onNewProject={() => {
                    setEditingProject(null);
                    setShowProjectForm(true);
                }}
                onEditProject={(projectId) => {
                    setEditingProject(projectId);
                    setShowProjectForm(true);
                }}
                onDeleteProject={handleDeleteProject}
                getProjectColor={getProjectColor}
            />

            {/* Main Content */}
            <div className="bg-white overflow-auto">
                {/* Project Form Modal */}
                {showProjectForm && (
                    <ProjectForm
                        editingProject={editingProject ?
                            projects.find((p: any) => p.id === editingProject) as EnhancedProject :
                            undefined
                        }
                        onClose={() => {
                            setShowProjectForm(false);
                            setEditingProject(null);
                        }}
                        onSave={(data) => {
                            if (editingProject) {
                                handleUpdateProject(editingProject, data);
                            } else {
                                handleCreateProject(data);
                            }
                        }}
                        gradients={GRADIENTS}
                    />
                )}

                {/* Project Header */}
                {activeProject && activeProjectDetails && (
                    <ProjectHeader
                        project={activeProjectDetails}
                        onEdit={() => {
                            setEditingProject(activeProject);
                            setShowProjectForm(true);
                        }}
                        onDelete={() => {
                            if (window.confirm(`Are you sure you want to delete "${activeProjectDetails.name}"? This will delete all posts within it.`)) {
                                handleDeleteProject(activeProject);
                            }
                        }}
                        getProjectColor={getProjectColor}
                    />
                )}

                {/* What's on your mind box + Timeline */}
                <div className="max-w-[800px] mx-auto p-4">
                    {/* What's on your mind? box - Always present in project view */}
                    {activeProject && activeProjectDetails && (
                        <PostComposer
                            project={activeProjectDetails}
                            getProjectColor={getProjectColor}
                            onPost={handleCreatePost}
                            imageFileRef={imageFileRef}
                        />
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
                                    <PostItem
                                        key={post.id}
                                        post={post}
                                        getProjectColor={getProjectColor}
                                        onDelete={() => handleDeletePost(post.id)}
                                        onLike={() => toggleLike(post)}
                                        isProjectView={true}
                                    />
                                ))
                        ) : (
                            // Show all posts in home feed
                            allPosts.map((post: Post) => (
                                <PostItem
                                    key={post.id}
                                    post={post}
                                    getProjectColor={getProjectColor}
                                    onDelete={() => handleDeletePost(post.id)}
                                    onLike={() => toggleLike(post)}
                                    isProjectView={false}
                                    onProjectClick={() => setActiveProject(post.projectId)}
                                />
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