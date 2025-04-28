import React, { useRef } from 'react';
import { ImageIcon } from 'lucide-react';
import { EnhancedProject } from '../ProjectsView';

interface PostComposerProps {
    project: EnhancedProject;
    getProjectColor: (projectId: string) => string;
    onPost: (data: { content: string, files?: FileList }) => Promise<void>;
    imageFileRef: React.RefObject<HTMLInputElement>;
}

const PostComposer: React.FC<PostComposerProps> = ({
    project,
    getProjectColor,
    onPost,
    imageFileRef
}) => {
    const contentRef = useRef<HTMLTextAreaElement>(null);

    const handlePost = async () => {
        if (!contentRef.current || !contentRef.current.value.trim()) {
            alert("Please enter some content for your post");
            return;
        }

        const filesInput = document.getElementById('image-file') as HTMLInputElement;

        await onPost({
            content: contentRef.current.value,
            files: filesInput.files || undefined
        });

        // Clear the input after posting
        contentRef.current.value = '';
        if (filesInput) filesInput.value = '';
        const fileNameDiv = document.getElementById('image-file-name');
        if (fileNameDiv) fileNameDiv.textContent = '';
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
            <div className="p-4">
                <div className="flex">
                    <div className="mr-3">
                        <div className={`w-10 h-10 ${getProjectColor(project.id)} rounded-full flex items-center justify-center`}>
                            <span className="text-white font-bold">{project.name.charAt(0).toUpperCase()}</span>
                        </div>
                    </div>
                    <div className="flex-1">
                        <textarea
                            ref={contentRef}
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
                        onClick={handlePost}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 font-medium text-sm"
                    >
                        Post
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PostComposer; 