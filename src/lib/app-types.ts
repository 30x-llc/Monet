export interface AppMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: string;
}

export interface AppDoc {
    title: string;
    html: string;
    messages: AppMessage[];
}

export interface StoredApp {
    id: string;
    app: AppDoc;
    createdAt: string;
    updatedAt: string;
}
