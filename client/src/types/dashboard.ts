// Entity Interfaces
export interface Collection {
    id: string;
    name: string;
    createdAt: string;
    items?: Item[];
}

export interface Item {
    id: string;
    createdAt: string;
    [key: string]: any;
}

// Component Props Interfaces
export interface CollectionListProps {
    collections: Collection[];
    activeCollection: string | null;
    onSelectCollection: (id: string) => void;
}

export interface CollectionFormProps {
    onSubmit: (name: string) => void;
    onCancel: () => void;
}

export interface ItemsListProps {
    items: Item[];
}

export interface ItemFormProps {
    collectionType?: string;
    onSubmit: (data: any) => void;
    onCancel: () => void;
}

// Field Template Interface
export interface FieldTemplate {
    key: string;
    label: string;
    type: string;
} 