import { useState } from 'react';
import { CollectionFormProps } from '../types/dashboard';

export default function CollectionForm({ onSubmit, onCancel }: CollectionFormProps) {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSubmit(name.trim());
            setName('');
        }
    };

    return (
        <form className="collection-form" onSubmit={handleSubmit}>
            <div className="form-group">
                <label htmlFor="collection-name">Collection Name</label>
                <input
                    id="collection-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Books, Workouts, Water Intake"
                    autoFocus
                />
            </div>
            <div className="form-actions">
                <button type="button" onClick={onCancel} className="button-cancel">
                    Cancel
                </button>
                <button type="submit" className="button-primary" disabled={!name.trim()}>
                    Create Collection
                </button>
            </div>
        </form>
    );
} 