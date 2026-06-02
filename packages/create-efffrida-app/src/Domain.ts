export const templates = ["agent-only", "app-and-agent"] as const;
export type TemplateType = (typeof templates)[number];

export interface ProjectConfig {
    readonly projectName: string;
    readonly template: TemplateType;
    readonly withOxcTools: boolean;
    readonly withNodeTests: boolean;
    readonly withFridaTests: boolean;
    readonly withWorkflows: boolean;
    readonly withNixFlake: boolean;
    readonly withChangesets: boolean;
}
