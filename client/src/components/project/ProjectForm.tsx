import React, { useState } from 'react';
import { X } from 'lucide-react';
import { EnhancedProject, GradientBackground } from '../ProjectsView';

interface ProjectFormProps {
    editingProject?: EnhancedProject;
    onClose: () => void;
    onSave: (data: {
        name: string,
        isPublic: boolean,
        headerBackground?: GradientBackground
    }) => void;
    gradients: { from: string, to: string }[];
}

const ProjectForm: React.FC<ProjectFormProps> = ({
    editingProject,
    onClose,
    onSave,
    gradients
}) => {
    const [selectedGradient, setSelectedGradient] = useState<number>(
        editingProject?.headerBackground?.type === 'gradient'
            ? gradients.findIndex(g =>
                g.from === editingProject.headerBackground?.from &&
                g.to === editingProject.headerBackground?.to
            ) || 0
            : 0
    );

    const handleSubmit = () => {
        const nameInput = document.getElementById('project-name') as HTMLInputElement;
        const isPublicInput = document.getElementById('project-public') as HTMLInputElement;

        if (!nameInput.value.trim()) {
            alert('Please enter a project name');
            return;
        }

        const headerBackground: GradientBackground = {
            type: 'gradient',
            from: gradients[selectedGradient].from,
            to: gradients[selectedGradient].to
        };

        onSave({
            name: nameInput.value,
            isPublic: isPublicInput.checked,
            headerBackground
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-md rounded-lg shadow-lg overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{editingProject ? 'Edit Project' : 'Create New Project'}</h3>
                    <button
                        onClick={onClose}
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
                            defaultValue={editingProject?.name || ''}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Header Style</label>
                        <div className="grid grid-cols-3 gap-2">
                            {gradients.map((gradient, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    className={`h-12 rounded-md transition-all ${selectedGradient === index ? 'ring-2 ring-indigo-500 ring-offset-2' : 'hover:opacity-80'}`}
                                    style={{
                                        background: `linear-gradient(to right, ${gradient.from}, ${gradient.to})`
                                    }}
                                    onClick={() => setSelectedGradient(index)}
                                ></button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                id="project-public"
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                defaultChecked={editingProject?.isPublic || false}
                            />
                            <span className="ml-2 text-sm text-gray-700">Make this project public</span>
                        </label>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-indigo-600 rounded-md text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            {editingProject ? 'Save Changes' : 'Create Project'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectForm; 