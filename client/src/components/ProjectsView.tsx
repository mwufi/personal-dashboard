import { useState, useEffect, useRef } from 'react';
import { id } from '@instantdb/react';
import { Project, ProjectNote } from '../types/dashboard';
import db from '../lib/instant';
import { FolderIcon, LockIcon, UnlockIcon, PlusIcon, Pin, PinOff, Trash2 } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { uploadFile, getFileMetadata } from '../lib/fileService';

export default function ProjectsView() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const projectId = searchParams.get('id');

    const [activeProject, setActiveProject] = useState<string | null>(projectId);
    const [showNewProjectForm, setShowNewProjectForm] = useState(false);
    const [showNewNoteForm, setShowNewNoteForm] = useState(false);
    const [editingNote, setEditingNote] = useState<ProjectNote | null>(null);
    const [showEditProjectForm, setShowEditProjectForm] = useState(false);

    // File input references - moved to the top with other hooks
    const projectHeaderFileRef = useRef<HTMLInputElement>(null);
    const editProjectHeaderFileRef = useRef<HTMLInputElement>(null);

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
        const projectHeaderFile = document.getElementById('project-header-file') as HTMLInputElement;
        const headerFileNameDiv = document.getElementById('header-file-name');

        const editProjectHeaderFile = document.getElementById('edit-project-header-file') as HTMLInputElement;
        const editHeaderFileNameDiv = document.getElementById('edit-header-file-name');

        const handleProjectHeaderFileChange = () => {
            if (projectHeaderFile?.files?.length && headerFileNameDiv) {
                headerFileNameDiv.textContent = `Selected: ${projectHeaderFile.files[0].name}`;
            }
        };

        const handleEditProjectHeaderFileChange = () => {
            if (editProjectHeaderFile?.files?.length && editHeaderFileNameDiv) {
                editHeaderFileNameDiv.textContent = `Selected: ${editProjectHeaderFile.files[0].name}`;
            }
        };

        projectHeaderFile?.addEventListener('change', handleProjectHeaderFileChange);
        editProjectHeaderFile?.addEventListener('change', handleEditProjectHeaderFileChange);

        return () => {
            projectHeaderFile?.removeEventListener('change', handleProjectHeaderFileChange);
            editProjectHeaderFile?.removeEventListener('change', handleEditProjectHeaderFileChange);
        };
    }, [showNewProjectForm, showEditProjectForm]);

    if (isLoading) return <div className="p-8">Loading projects...</div>;
    if (error) return <div className="p-8 text-red-500">Error loading projects: {error.message}</div>;

    const { projects = [] } = data || {};
    const publicProjects = projects.filter((project: any) => project.isPublic);
    const privateProjects = projects.filter((project: any) => !project.isPublic);

    // Get current project and its notes
    const currentProject = activeProject
        ? projects.find((p: any) => p.id === activeProject)
        : null;

    const projectNotes = currentProject?.projectNotes || [];
    const pinnedNotes = projectNotes.filter((note: any) => note.isPinned);
    const unpinnedNotes = projectNotes.filter((note: any) => !note.isPinned);

    // Create a new project
    const handleCreateProject = async (data: { name: string, isPublic: boolean, headerImg?: string, headerFile?: File }) => {
        const newProjectId = id();

        let headerImg = data.headerImg || '';

        // Upload header image if provided
        if (data.headerFile) {
            try {
                const path = `projects/${newProjectId}/header-${Date.now()}-${data.headerFile.name}`;
                headerImg = await uploadFile(data.headerFile, path);
            } catch (error) {
                console.error('Error uploading header image:', error);
            }
        }

        db.transact(
            db.tx.projects[newProjectId].update({
                name: data.name,
                isPublic: data.isPublic,
                headerImg: headerImg,
                createdAt: new Date().toISOString()
            })
        );

        setShowNewProjectForm(false);
        setActiveProject(newProjectId);
    };

    // Create a new note with possible file attachments
    const handleCreateNote = async (data: { content: string, attachmentUrls?: string[], isPinned: boolean, files?: FileList }) => {
        if (!activeProject) return;

        let attachmentUrls = data.attachmentUrls || [];

        // Generate a note ID first so we can use it in the file path
        const newNoteId = id();

        // Upload any new files
        if (data.files && data.files.length > 0) {
            try {
                const filePromises = Array.from(data.files).map(file => {
                    const path = `projects/${activeProject}/notes/${newNoteId}/${Date.now()}-${file.name}`;
                    return uploadFile(file, path);
                });
                const uploadedUrls = await Promise.all(filePromises);
                attachmentUrls = [...attachmentUrls, ...uploadedUrls];
            } catch (error) {
                console.error('Error uploading files:', error);
            }
        }

        db.transact([
            db.tx.projectNotes[newNoteId].update({
                content: data.content,
                attachmentUrls: attachmentUrls,
                isPinned: data.isPinned,
                createdAt: new Date().toISOString()
            }),
            db.tx.projects[activeProject].link({ projectNotes: newNoteId })
        ]);
        setShowNewNoteForm(false);
    };

    // Update an existing note
    const handleUpdateNote = async (noteId: string, data: { content: string, attachmentUrls?: string[], isPinned: boolean, files?: FileList }) => {
        let attachmentUrls = data.attachmentUrls || [];

        // Upload any new files
        if (data.files && data.files.length > 0) {
            try {
                const filePromises = Array.from(data.files).map(file => {
                    const path = `projects/${activeProject}/notes/${noteId}/${Date.now()}-${file.name}`;
                    return uploadFile(file, path);
                });
                const uploadedUrls = await Promise.all(filePromises);
                attachmentUrls = [...attachmentUrls, ...uploadedUrls];
            } catch (error) {
                console.error('Error uploading files:', error);
            }
        }

        db.transact(
            db.tx.projectNotes[noteId].update({
                content: data.content,
                attachmentUrls: attachmentUrls,
                isPinned: data.isPinned
            })
        );

        setShowNewNoteForm(false);
        setEditingNote(null);
    };

    // Delete a note
    const handleDeleteNote = (noteId: string) => {
        db.transact(db.tx.projectNotes[noteId].delete());
    };

    // Toggle pin status of a note
    const togglePinStatus = (note: any) => {
        db.transact(
            db.tx.projectNotes[note.id].update({
                isPinned: !note.isPinned,
                // Preserve other fields to avoid losing them
                content: note.content,
                attachmentUrls: note.attachmentUrls || []
            })
        );
    };

    // Update setActiveProject to also update the URL
    const handleSelectProject = (id: string) => {
        setActiveProject(id);
    };

    // Render file attachments for a note
    const renderAttachments = (attachmentUrls: string[] = []) => {
        if (!attachmentUrls.length) return null;

        return (
            <div className="mt-2 pt-2 border-t">
                <h4 className="text-xs text-muted-foreground mb-1">Attachments:</h4>
                <div className="flex flex-wrap gap-2">
                    {attachmentUrls.map((url, index) => {
                        const { name } = getFileMetadata(url);
                        const isImage = url.match(/\.(jpeg|jpg|gif|png)$/i);

                        return (
                            <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-xs bg-gray-100 rounded px-2 py-1 hover:bg-gray-200"
                            >
                                {isImage ? (
                                    <span className="mr-1">🖼️</span>
                                ) : (
                                    <span className="mr-1">📎</span>
                                )}
                                <span className="truncate max-w-[100px]">{name}</span>
                            </a>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleString();
        } catch (e) {
            return dateString;
        }
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

    // Update a project
    const handleUpdateProject = async (data: { name: string, isPublic: boolean, headerImg?: string, headerFile?: File }) => {
        if (!activeProject) return;

        let headerImg = data.headerImg || '';

        // Upload header image if provided
        if (data.headerFile) {
            try {
                const path = `projects/${activeProject}/header-${Date.now()}-${data.headerFile.name}`;
                headerImg = await uploadFile(data.headerFile, path);
            } catch (error) {
                console.error('Error uploading header image:', error);
            }
        }

        db.transact(
            db.tx.projects[activeProject].update({
                name: data.name,
                isPublic: data.isPublic,
                headerImg: headerImg
            })
        );

        setShowEditProjectForm(false);
    };

    return (
        <div className="grid grid-cols-[250px_1fr] h-full">
            {/* Projects Sidebar */}
            <div className="bg-muted p-4 overflow-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Projects</h2>
                    <button
                        onClick={() => setShowNewProjectForm(true)}
                        className="p-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        <PlusIcon className="h-4 w-4" />
                    </button>
                </div>

                {showNewProjectForm && (
                    <div className="mb-4 p-3 bg-card rounded-md shadow">
                        <h3 className="text-sm font-medium mb-2">New Project</h3>
                        <input
                            type="text"
                            placeholder="Project name"
                            className="w-full p-2 mb-2 text-sm bg-background rounded border"
                            id="project-name"
                        />
                        <div className="mb-2">
                            <label htmlFor="project-header-img" className="text-xs block mb-1">Header Image (optional)</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Image URL"
                                    className="flex-1 p-2 text-sm bg-background rounded border"
                                    id="project-header-img"
                                />
                                <span className="text-xs self-center">OR</span>
                                <button
                                    onClick={() => projectHeaderFileRef.current?.click()}
                                    className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                                >
                                    Upload
                                </button>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={projectHeaderFileRef}
                                    id="project-header-file"
                                />
                            </div>
                            <div id="header-file-name" className="text-xs mt-1 text-muted-foreground"></div>
                        </div>
                        <div className="flex items-center mb-2">
                            <input
                                type="checkbox"
                                id="is-public"
                                className="mr-2"
                            />
                            <label htmlFor="is-public" className="text-xs">Make public</label>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowNewProjectForm(false)}
                                className="px-2 py-1 text-xs rounded hover:bg-muted"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    const nameInput = document.getElementById('project-name') as HTMLInputElement;
                                    const headerImgInput = document.getElementById('project-header-img') as HTMLInputElement;
                                    const headerFileInput = document.getElementById('project-header-file') as HTMLInputElement;
                                    const isPublicInput = document.getElementById('is-public') as HTMLInputElement;

                                    await handleCreateProject({
                                        name: nameInput.value,
                                        headerImg: headerImgInput.value,
                                        headerFile: headerFileInput.files?.[0],
                                        isPublic: isPublicInput.checked
                                    });
                                }}
                                className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                )}

                {publicProjects.length > 0 && (
                    <div className="mb-4">
                        <h3 className="text-sm text-muted-foreground mb-2 flex items-center">
                            <UnlockIcon className="h-3 w-3 mr-1" /> Public Projects
                        </h3>
                        <ul className="space-y-1">
                            {publicProjects.map((project: any) => (
                                <li key={project.id}>
                                    <button
                                        className={`flex items-center w-full p-2 text-sm rounded ${activeProject === project.id ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
                                        onClick={() => handleSelectProject(project.id)}
                                    >
                                        <FolderIcon className="h-4 w-4 mr-2" />
                                        <span className="truncate">{project.name}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {privateProjects.length > 0 && (
                    <div>
                        <h3 className="text-sm text-muted-foreground mb-2 flex items-center">
                            <LockIcon className="h-3 w-3 mr-1" /> Private Projects
                        </h3>
                        <ul className="space-y-1">
                            {privateProjects.map((project: any) => (
                                <li key={project.id}>
                                    <button
                                        className={`flex items-center w-full p-2 text-sm rounded ${activeProject === project.id ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
                                        onClick={() => handleSelectProject(project.id)}
                                    >
                                        <FolderIcon className="h-4 w-4 mr-2" />
                                        <span className="truncate">{project.name}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Project Content */}
            <div className="p-6 overflow-auto">
                {!activeProject ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <FolderIcon className="h-16 w-16 mb-4" />
                        <h2 className="text-xl font-semibold mb-2">No Project Selected</h2>
                        <p>Select a project from the sidebar or create a new one.</p>
                    </div>
                ) : (
                    <>
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h1 className="text-2xl font-bold">{currentProject?.name}</h1>
                                <div className="flex items-center gap-2">
                                    {currentProject?.isPublic ? (
                                        <span className="flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                            <UnlockIcon className="h-3 w-3 mr-1" /> Public
                                        </span>
                                    ) : (
                                        <span className="flex items-center text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                            <LockIcon className="h-3 w-3 mr-1" /> Private
                                        </span>
                                    )}
                                    <button
                                        onClick={() => setShowEditProjectForm(true)}
                                        className="flex items-center text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded hover:bg-gray-200"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                                        </svg>
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm("Are you sure you want to delete this project and all its notes? This action cannot be undone.")) {
                                                handleDeleteProject(currentProject?.id || '');
                                            }
                                        }}
                                        className="flex items-center text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200"
                                    >
                                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                                    </button>
                                </div>
                            </div>

                            {showEditProjectForm && (
                                <div className="mb-4 p-4 bg-card rounded-md shadow">
                                    <h3 className="text-sm font-medium mb-3">Edit Project</h3>
                                    <div className="mb-3">
                                        <label htmlFor="edit-project-name" className="text-sm block mb-1">Project Name</label>
                                        <input
                                            type="text"
                                            id="edit-project-name"
                                            className="w-full p-2 text-sm bg-background rounded border"
                                            defaultValue={currentProject?.name || ''}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="edit-project-header" className="text-sm block mb-1">Header Image</label>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                id="edit-project-header"
                                                className="flex-1 p-2 text-sm bg-background rounded border"
                                                defaultValue={currentProject?.headerImg || ''}
                                                placeholder="Image URL"
                                            />
                                            <span className="text-xs self-center">OR</span>
                                            <button
                                                onClick={() => editProjectHeaderFileRef.current?.click()}
                                                className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                                            >
                                                Upload
                                            </button>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                ref={editProjectHeaderFileRef}
                                                id="edit-project-header-file"
                                            />
                                        </div>
                                        <div id="edit-header-file-name" className="text-xs mt-1 text-muted-foreground"></div>
                                        {currentProject?.headerImg && (
                                            <div className="mt-2">
                                                <div className="relative h-24 w-full rounded overflow-hidden">
                                                    <img
                                                        src={currentProject.headerImg}
                                                        alt="Current header"
                                                        className="h-full w-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                        <span className="text-white text-xs">Current header image</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center mb-3">
                                        <input
                                            type="checkbox"
                                            id="edit-is-public"
                                            className="mr-2"
                                            defaultChecked={currentProject?.isPublic || false}
                                        />
                                        <label htmlFor="edit-is-public" className="text-sm">Public project</label>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => setShowEditProjectForm(false)}
                                            className="px-3 py-1 text-sm rounded hover:bg-muted"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const nameInput = document.getElementById('edit-project-name') as HTMLInputElement;
                                                const headerInput = document.getElementById('edit-project-header') as HTMLInputElement;
                                                const headerFileInput = document.getElementById('edit-project-header-file') as HTMLInputElement;
                                                const isPublicInput = document.getElementById('edit-is-public') as HTMLInputElement;

                                                await handleUpdateProject({
                                                    name: nameInput.value,
                                                    headerImg: headerInput.value,
                                                    headerFile: headerFileInput.files?.[0],
                                                    isPublic: isPublicInput.checked
                                                });
                                            }}
                                            className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            )}

                            {currentProject?.headerImg && (
                                <div className="w-full h-40 rounded-lg overflow-hidden mb-4">
                                    <img
                                        src={currentProject.headerImg}
                                        alt={currentProject.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold">Project Notes</h2>
                                <button
                                    onClick={() => {
                                        setEditingNote(null);
                                        setShowNewNoteForm(true);
                                    }}
                                    className="flex items-center px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
                                >
                                    <PlusIcon className="h-4 w-4 mr-1" /> Add Note
                                </button>
                            </div>

                            {showNewNoteForm && (
                                <div className="mb-4 p-4 bg-card rounded-md shadow">
                                    <h3 className="text-sm font-medium mb-2">
                                        {editingNote ? 'Edit Note' : 'New Note'}
                                    </h3>
                                    <textarea
                                        id="note-content"
                                        className="w-full p-3 mb-3 text-sm bg-background rounded border min-h-[100px]"
                                        placeholder="Enter note content..."
                                        defaultValue={editingNote?.content || ''}
                                    ></textarea>

                                    <div className="mb-3">
                                        <label className="text-sm block mb-1">Attachments</label>
                                        <input
                                            type="file"
                                            id="note-files"
                                            multiple
                                            className="text-sm"
                                        />
                                    </div>

                                    {editingNote?.attachmentUrls && editingNote.attachmentUrls.length > 0 && (
                                        <div className="mb-3">
                                            <label className="text-sm block mb-1">Existing Attachments</label>
                                            {renderAttachments(editingNote.attachmentUrls)}
                                        </div>
                                    )}

                                    <div className="flex items-center mb-3">
                                        <input
                                            type="checkbox"
                                            id="is-pinned"
                                            className="mr-2"
                                            defaultChecked={editingNote?.isPinned || false}
                                        />
                                        <label htmlFor="is-pinned" className="text-sm">Pin this note</label>
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => {
                                                setShowNewNoteForm(false);
                                                setEditingNote(null);
                                            }}
                                            className="px-3 py-1 text-sm rounded hover:bg-muted"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const contentInput = document.getElementById('note-content') as HTMLTextAreaElement;
                                                const isPinnedInput = document.getElementById('is-pinned') as HTMLInputElement;
                                                const filesInput = document.getElementById('note-files') as HTMLInputElement;

                                                const noteData = {
                                                    content: contentInput.value,
                                                    isPinned: isPinnedInput.checked,
                                                    files: filesInput.files || undefined,
                                                    attachmentUrls: editingNote?.attachmentUrls || []
                                                };

                                                if (editingNote) {
                                                    await handleUpdateNote(editingNote.id, noteData);
                                                } else {
                                                    await handleCreateNote(noteData);
                                                }
                                            }}
                                            className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
                                        >
                                            {editingNote ? 'Update' : 'Save'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {pinnedNotes.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-sm text-muted-foreground mb-2 flex items-center">
                                        <Pin className="h-3 w-3 mr-1" /> Pinned Notes
                                    </h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        {pinnedNotes.map((note: any) => (
                                            <div key={note.id} className="p-4 bg-amber-50 rounded-md shadow-sm border border-amber-200">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex-1 whitespace-pre-wrap">{note.content}</div>
                                                    <div className="flex space-x-1 ml-2">
                                                        <button
                                                            onClick={() => togglePinStatus(note)}
                                                            className="p-1 text-amber-600 hover:bg-amber-100 rounded"
                                                        >
                                                            <PinOff className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingNote(note);
                                                                setShowNewNoteForm(true);
                                                            }}
                                                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil">
                                                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteNote(note.id)}
                                                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                {note.attachmentUrls && note.attachmentUrls.length > 0 && renderAttachments(note.attachmentUrls)}
                                                <div className="text-xs text-muted-foreground">
                                                    {formatDate(note.createdAt)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {unpinnedNotes.length > 0 ? (
                                <div>
                                    <h3 className="text-sm text-muted-foreground mb-2 flex items-center">
                                        <PinOff className="h-3 w-3 mr-1" /> Other Notes
                                    </h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        {unpinnedNotes.map((note: any) => (
                                            <div key={note.id} className="p-4 bg-card rounded-md shadow-sm border">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex-1 whitespace-pre-wrap">{note.content}</div>
                                                    <div className="flex space-x-1 ml-2">
                                                        <button
                                                            onClick={() => togglePinStatus(note)}
                                                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                                        >
                                                            <Pin className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingNote(note);
                                                                setShowNewNoteForm(true);
                                                            }}
                                                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil">
                                                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteNote(note.id)}
                                                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                {note.attachmentUrls && note.attachmentUrls.length > 0 && renderAttachments(note.attachmentUrls)}
                                                <div className="text-xs text-muted-foreground">
                                                    {formatDate(note.createdAt)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                !pinnedNotes.length && (
                                    <div className="flex flex-col items-center justify-center p-8 text-muted-foreground text-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4">
                                            <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                                            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                                            <path d="M2 2l7.586 7.586"></path>
                                            <circle cx="11" cy="11" r="2"></circle>
                                        </svg>
                                        <p>No notes yet. Create your first note to get started!</p>
                                    </div>
                                )
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
} 