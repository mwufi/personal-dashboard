import { ItemsListProps, Item } from '../types/dashboard';
import db from '../lib/instant';

export default function ItemsList({ items }: ItemsListProps) {
    if (items.length === 0) {
        return (
            <div className="empty-state">
                <p>No items in this collection yet.</p>
            </div>
        );
    }

    const handleDeleteItem = (itemId: string) => {
        db.transact(db.tx.items[itemId].delete());
    };

    // Dynamic rendering of item properties
    const renderItemContent = (item: Item) => {
        // Exclude these properties from rendering
        const excludedProps = ['id', 'createdAt'];

        return Object.entries(item)
            .filter(([key]) => !excludedProps.includes(key))
            .map(([key, value]) => {
                let displayValue = value;

                // Format different value types appropriately
                if (value === null || value === undefined) {
                    displayValue = '-';
                } else if (typeof value === 'boolean') {
                    displayValue = value ? 'Yes' : 'No';
                } else if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                }

                return (
                    <div key={key} className="item-property">
                        <span className="property-label">{key}:</span>
                        <span className="property-value">{displayValue}</span>
                    </div>
                );
            });
    };

    return (
        <div className="items-list">
            {items.map(item => (
                <div key={item.id} className="item-card">
                    <div className="item-content">
                        {renderItemContent(item)}
                        <div className="item-meta">
                            <span className="item-date">
                                {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    <button
                        className="delete-button"
                        onClick={() => handleDeleteItem(item.id)}
                        aria-label="Delete item"
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
} 