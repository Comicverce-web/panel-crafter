export type ProjectStyle = 'comic' | 'manga';
export type ProjectStatus = 'draft' | 'characters' | 'panels' | 'dialogues' | 'cover' | 'complete';

export interface Project {
  id: string;
  user_id: string;
  title: string;
  story: string | null;
  style: ProjectStyle;
  status: ProjectStatus;
  cover_image_url: string | null;
  cover_regen_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReferenceImage {
  id: string;
  project_id: string;
  image_url: string;
  label: string | null;
  created_at: string;
}

export interface Character {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_main: boolean;
  created_at: string;
}

export interface Panel {
  id: string;
  project_id: string;
  panel_number: number;
  description: string | null;
  image_url: string | null;
  dialogue: string | null;
  created_at: string;
}

export interface WorkflowStep {
  id: ProjectStatus;
  label: string;
  description: string;
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 'draft', label: 'Story', description: 'Write your story and add reference images' },
  { id: 'characters', label: 'Characters', description: 'Generate and customize your characters' },
  { id: 'panels', label: 'Panels', description: 'Generate comic panels from your story' },
  { id: 'dialogues', label: 'Dialogues', description: 'Add dialogues to your panels' },
  { id: 'cover', label: 'Cover', description: 'Generate a cover page for your manga' },
  { id: 'complete', label: 'Complete', description: 'Read and download your comic book' },
];
