import React from 'react';
import { MessageCircle, Heart, Repeat, Share, Trash2 } from 'lucide-react';
import { Post } from '../ProjectsView';

interface PostItemProps {
    post: Post;
    getProjectColor: (projectId: string) => string;
    onDelete: () => void;
    onLike: () => void;
    isProjectView: boolean;
    onProjectClick?: () => void;
}

const PostItem: React.FC<PostItemProps> = ({
    post,
    getProjectColor,
    onDelete,
    onLike,
    isProjectView,
    onProjectClick
}) => {
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

    return (
        <div className="py-4">
            <div className="flex">
                <div className="mr-3">
                    <div className={`w-10 h-10 ${getProjectColor(post.projectId)} rounded-full flex items-center justify-center`}>
                        <span className="text-white font-bold">{post.projectName.charAt(0).toUpperCase()}</span>
                    </div>
                </div>
                <div className="flex-1">
                    <div className="flex items-center">
                        {isProjectView ? (
                            <span className="font-bold mr-1">{post.projectName}</span>
                        ) : (
                            <span
                                className="font-bold mr-1 hover:text-indigo-600 cursor-pointer"
                                onClick={onProjectClick}
                            >
                                {post.projectName}
                            </span>
                        )}
                        <span className="text-gray-500 text-sm">· {formatDate(post.createdAt)}</span>
                        <div className="ml-auto">
                            <button
                                onClick={onDelete}
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
                            onClick={onLike}
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
    );
};

export default PostItem; 