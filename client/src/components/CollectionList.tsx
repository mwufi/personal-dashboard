import { CollectionListProps } from '../types/dashboard';

export default function CollectionList({
    collections,
    activeCollection,
    onSelectCollection
}: CollectionListProps) {
    if (collections.length === 0) {
        return (
            <div className="empty-state">
                <p>No collections yet. Create one to get started!</p>
            </div>
        );
    }

    return (
        <div className="collection-list">
            {collections.map(collection => (
                <div
                    key={collection.id}
                    className={`collection-item ${activeCollection === collection.id ? 'active' : ''}`}
                    onClick={() => onSelectCollection(collection.id)}
                >
                    <div className="collection-name">{collection.name}</div>
                    <div className="collection-meta">
                        <span className="item-count">{collection.items?.length || 0} items</span>
                    </div>
                </div>
            ))}
        </div>
    );
} 