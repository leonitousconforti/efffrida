export const templates = ["agent-only", "app-and-agent", "monorepo"] as const;
export type TemplateType = (typeof templates)[number];

export interface ProjectConfig {
    readonly projectName: string;
    readonly template: TemplateType;
    readonly withVitest: boolean;
    readonly withVitestPool: boolean;
    readonly withWorkflows: boolean;
    readonly withNixFlake: boolean;
    readonly withChangesets: boolean;
}
