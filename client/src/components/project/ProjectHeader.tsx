import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { EnhancedProject, GradientBackground } from '../ProjectsView';

interface ProjectHeaderProps {
    project: EnhancedProject;
    onEdit: () => void;
    onDelete: () => void;
    getProjectColor: (projectId: string) => string;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project, onEdit, onDelete, getProjectColor }) => {
    // Determine the header background style
    const getHeaderStyle = () => {
        if (project.headerBackground?.type === 'gradient') {
            return {
                background: `linear-gradient(to right, ${project.headerBackground.from}, ${project.headerBackground.to})`
            };
        }
        return {
            background: 'linear-gradient(to right, #f5f7fa, #e4e7eb)'
        };
    };

    // Determine if we need dark text (for light backgrounds) or light text (for dark backgrounds)
    const isDarkText = () => {
        // Simple heuristic: if the first color of the gradient starts with a light color, use dark text
        if (project.headerBackground?.type === 'gradient') {
            const color = project.headerBackground.from;
            // If the color is in hex format and is relatively light
            if (color.startsWith('#') && (
                color.toLowerCase().includes('f') ||
                color.toLowerCase().includes('e') ||
                color.toLowerCase().includes('d') ||
                color.toLowerCase().includes('c')
            )) {
                return true;
            }
        }
        // Default to dark text for our pastel gradients
        return true;
    };

    const textColor = isDarkText() ? 'text-gray-800' : 'text-white';
    const subtextColor = isDarkText() ? 'text-gray-600' : 'text-white/80';
    const buttonBgColor = isDarkText() ? 'bg-white/20 hover:bg-white/30' : 'bg-black/20 hover:bg-black/30';

    return (
        <div style={getHeaderStyle()} className="p-8">
            <div className="max-w-[800px] mx-auto">
                <div className="flex items-start space-x-6">
                    <div className={`w-32 h-32 ${getProjectColor(project.id)} shadow-lg rounded-lg flex items-center justify-center`}>
                        <span className="text-4xl font-bold text-white">{project.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1">
                        <div className={`text-xs uppercase font-bold ${subtextColor}`}>Project</div>
                        <h1 className={`text-4xl font-bold my-2 ${textColor} text-left`}>{project.name}</h1>
                        <div className="flex items-center text-sm space-x-4 mt-3">
                            <div className="flex items-center">
                                <span className={`font-bold ${textColor}`}>{(project.projectNotes || []).length}</span>
                                <span className={`ml-1 ${subtextColor}`}>posts</span>
                            </div>
                            <div>
                                <span className={`flex items-center px-2 py-1 ${buttonBgColor} rounded-full text-xs ${textColor}`}>
                                    {project.isPublic ? 'Public' : 'Private'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="flex space-x-2">
                            <button
                                onClick={onEdit}
                                className={`p-2 ${buttonBgColor} rounded-full`}
                            >
                                <Pencil className={`h-4 w-4 ${textColor}`} />
                            </button>
                            <button
                                onClick={onDelete}
                                className={`p-2 ${buttonBgColor} rounded-full hover:bg-red-400/50`}
                            >
                                <Trash2 className={`h-4 w-4 ${textColor}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectHeader; 