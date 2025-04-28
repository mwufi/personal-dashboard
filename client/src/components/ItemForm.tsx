import { useState } from 'react';
import { ItemFormProps, FieldTemplate } from '../types/dashboard';

// Define field templates for different collection types
const collectionTemplates: Record<string, FieldTemplate[]> = {
    Books: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'author', label: 'Author', type: 'text' },
        { key: 'pages', label: 'Pages', type: 'number' },
        { key: 'read', label: 'Read', type: 'checkbox' },
        { key: 'rating', label: 'Rating (1-5)', type: 'range' },
    ],
    Workouts: [
        { key: 'type', label: 'Type', type: 'text' },
        { key: 'duration', label: 'Duration (minutes)', type: 'number' },
        { key: 'calories', label: 'Calories Burned', type: 'number' },
        { key: 'date', label: 'Date', type: 'date' },
    ],
    'Water Intake': [
        { key: 'amount', label: 'Amount (ml)', type: 'number' },
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'time', label: 'Time', type: 'time' },
    ],
    People: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Phone', type: 'tel' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    // Default template for any other collection type
    default: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea' },
    ]
};

export default function ItemForm({ collectionType = 'default', onSubmit, onCancel }: ItemFormProps) {
    // Get fields based on collection type or use default
    const fields = collectionTemplates[collectionType] || collectionTemplates.default;

    // Initialize form data based on fields
    const initialData = fields.reduce((acc, field) => {
        if (field.type === 'checkbox') acc[field.key] = false;
        else if (field.type === 'number' || field.type === 'range') acc[field.key] = 0;
        else if (field.type === 'date') acc[field.key] = new Date().toISOString().split('T')[0];
        else acc[field.key] = '';
        return acc;
    }, {} as Record<string, any>);

    const [formData, setFormData] = useState(initialData);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        let finalValue: any = value;

        if (type === 'checkbox') {
            finalValue = (e.target as HTMLInputElement).checked;
        } else if (type === 'number' || type === 'range') {
            finalValue = parseFloat(value) || 0;
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        setFormData(initialData);
    };

    return (
        <form className="item-form" onSubmit={handleSubmit}>
            <h3>Add to {collectionType}</h3>

            {fields.map(field => (
                <div key={field.key} className="form-group">
                    <label htmlFor={field.key}>{field.label}</label>

                    {field.type === 'textarea' ? (
                        <textarea
                            id={field.key}
                            name={field.key}
                            value={formData[field.key]}
                            onChange={handleChange}
                            rows={3}
                        />
                    ) : field.type === 'checkbox' ? (
                        <input
                            id={field.key}
                            name={field.key}
                            type="checkbox"
                            checked={!!formData[field.key]}
                            onChange={handleChange}
                        />
                    ) : field.type === 'range' ? (
                        <div className="range-container">
                            <input
                                id={field.key}
                                name={field.key}
                                type="range"
                                min="1"
                                max="5"
                                value={formData[field.key]}
                                onChange={handleChange}
                            />
                            <span className="range-value">{formData[field.key]}</span>
                        </div>
                    ) : (
                        <input
                            id={field.key}
                            name={field.key}
                            type={field.type}
                            value={formData[field.key]}
                            onChange={handleChange}
                            min={field.type === 'number' ? '0' : undefined}
                        />
                    )}
                </div>
            ))}

            <div className="form-actions">
                <button type="button" onClick={onCancel} className="button-cancel">
                    Cancel
                </button>
                <button type="submit" className="button-primary">
                    Add Item
                </button>
            </div>
        </form>
    );
} 