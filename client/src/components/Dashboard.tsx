import { useState } from 'react';
import { id } from '@instantdb/react';
import CollectionList from './CollectionList';
import CollectionForm from './CollectionForm';
import ItemsList from './ItemsList';
import ItemForm from './ItemForm';
import { Collection, Item } from '../types/dashboard';
import './Dashboard.css';
import db from '../lib/instant';

// Type for our query response
interface DashboardQueryResponse {
    collections?: Collection[];
}

export default function Dashboard() {
    const [activeCollection, setActiveCollection] = useState<string | null>(null);
    const [isAddingCollection, setIsAddingCollection] = useState(false);
    const [isAddingItem, setIsAddingItem] = useState(false);

    // Query to get collections and their items
    const { isLoading, error, data } = db.useQuery<DashboardQueryResponse>({
        collections: {
            items: {},
        },
    });

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    const { collections = [] } = data;

    const handleAddCollection = (name: string) => {
        const collectionId = id();
        db.transact(
            db.tx.collections[collectionId].update({
                name,
                createdAt: new Date().toISOString(),
            })
        );
        setIsAddingCollection(false);
    };

    const handleAddItem = (itemData: Partial<Item>) => {
        const itemId = id();
        db.transact([
            db.tx.items[itemId].update({
                ...itemData,
                createdAt: new Date().toISOString(),
            }),
            // Link the item to the active collection
            activeCollection ?
                db.tx.collections[activeCollection].link({ items: itemId }) :
                null,
        ].filter(Boolean));
        setIsAddingItem(false);
    };

    return (
        <div className="dashboard">
            <h1>Personal Dashboard</h1>

            <div className="dashboard-layout">
                <div className="collections-panel">
                    <div className="panel-header">
                        <h2>Collections</h2>
                        <button onClick={() => setIsAddingCollection(true)}>+ Add Collection</button>
                    </div>

                    {isAddingCollection ? (
                        <CollectionForm
                            onSubmit={handleAddCollection}
                            onCancel={() => setIsAddingCollection(false)}
                        />
                    ) : (
                        <CollectionList
                            collections={collections}
                            activeCollection={activeCollection}
                            onSelectCollection={setActiveCollection}
                        />
                    )}
                </div>

                <div className="items-panel">
                    <div className="panel-header">
                        <h2>
                            {activeCollection
                                ? collections.find(c => c.id === activeCollection)?.name || 'Items'
                                : 'Select a collection'}
                        </h2>
                        {activeCollection && (
                            <button onClick={() => setIsAddingItem(true)}>+ Add Item</button>
                        )}
                    </div>

                    {isAddingItem && activeCollection ? (
                        <ItemForm
                            collectionType={collections.find(c => c.id === activeCollection)?.name}
                            onSubmit={handleAddItem}
                            onCancel={() => setIsAddingItem(false)}
                        />
                    ) : (
                        <ItemsList
                            items={activeCollection ?
                                collections.find(c => c.id === activeCollection)?.items || [] :
                                []}
                        />
                    )}
                </div>
            </div>
        </div>
    );
} 