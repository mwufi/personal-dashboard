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

// Project Types
export interface Project {
    id: string;
    name: string;
    headerImg?: string;
    projectNotes?: ProjectNote[];
    isPublic: boolean;
    createdAt: string;
}

export interface ProjectNote {
    id: string;
    content: string;
    attachmentUrls?: string[];
    isPinned: boolean;
    project?: Project;
    createdAt: string;
}

// Personal Dashboard Types
export interface Book {
    id: string;
    title: string;
    author: string;
    status: 'to-read' | 'in-progress' | 'completed';
    startDate?: string;
    finishDate?: string;
    rating?: number;
    notes?: string;
    coverUrl?: string;
    createdAt: string;
}

export interface WaterIntake {
    id: string;
    date: string;
    amount: number; // in ml
    time: string;
    createdAt: string;
}

export interface BlogPost {
    id: string;
    title: string;
    content: string;
    tags?: string[];
    status: 'draft' | 'published';
    lastEdited: string;
    publishedDate?: string;
    createdAt: string;
}

export interface Habit {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    completions?: HabitCompletion[];
}

export interface HabitCompletion {
    id: string;
    habitId: string;
    date: string;
    completed: boolean;
    notes?: string;
    createdAt: string;
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

// Sidebar Types
export interface SidebarProps {
    activeView: string;
    onSelectView: (view: string) => void;
}

// Project Component Props
export interface ProjectsViewProps {
    activeProject?: string;
    onSelectProject?: (id: string) => void;
}

export interface ProjectSidebarProps {
    projects: Project[];
    activeProject: string | null;
    onSelectProject: (id: string) => void;
}

export interface ProjectFormProps {
    onSubmit: (data: { name: string, isPublic: boolean, headerImg?: string }) => void;
    onCancel: () => void;
}

export interface ProjectNoteFormProps {
    projectId: string;
    onSubmit: (data: { content: string, attachmentUrls?: string[], isPinned: boolean }) => void;
    onCancel: () => void;
    note?: ProjectNote;
}

// Dashboard View Props
export interface DashboardViewProps {
    activeView: string;
}

// Fix for InstantDB query type constraint
export interface QueryParams {
    [key: string]: any;
} 