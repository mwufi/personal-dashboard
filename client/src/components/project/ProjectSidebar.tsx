import React from 'react';
import { FolderIcon, Music, PlusIcon, Pencil, Trash2 } from 'lucide-react';
import { EnhancedProject } from '../ProjectsView';

interface ProjectSidebarProps {
    projects: any[];
    activeProject: string | null;
    setActiveProject: (id: string | null) => void;
    onNewProject: () => void;
    onEditProject: (projectId: string) => void;
    onDeleteProject: (projectId: string) => void;
    getProjectColor: (projectId: string) => string;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
    projects,
    activeProject,
    setActiveProject,
    onNewProject,
    onEditProject,
    onDeleteProject,
    getProjectColor
}) => {
    return (
        <div className="bg-[#2d2d2d] p-4 overflow-auto overflow-x-hidden border-r border-[#3d3d3d]">
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
                        onClick={onNewProject}
                        className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-[#3a3a3a]"
                    >
                        <PlusIcon className="h-4 w-4" />
                    </button>
                </div>

                {projects.length > 0 ? (
                    <div className="flex flex-col space-y-1 pr-2 mb-4">
                        {projects.map((project: EnhancedProject) => (
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
                                    <div className="ml-3 truncate text-left">
                                        <div className="font-medium">{project.name}</div>
                                        <div className="text-xs text-gray-400">{(project.projectNotes || []).length} posts</div>
                                    </div>
                                </button>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex">
                                    <button
                                        onClick={() => onEditProject(project.id)}
                                        className="text-gray-400 hover:text-white p-1"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm(`Are you sure you want to delete "${project.name}"? This will delete all posts within it.`)) {
                                                onDeleteProject(project.id);
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
                        onClick={onNewProject}
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-md py-2 font-medium hover:opacity-90 transition"
                    >
                        New Project
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectSidebar; 