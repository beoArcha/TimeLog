import { Project } from '@bindings/Project';

export function addProjectOp(
  projects: Project[],
  nextId: string,
  name: string,
  color = 'indigo'
): Project {
  const newProject: Project = {
    id: nextId,
    name,
    color,
    createdAt: new Date().toISOString(),
    archived: false,
    description: null,
    icon: null,
    tags: null,
  };
  projects.push(newProject);
  return newProject;
}

export function renameProjectOp(
  projects: Project[],
  projectId: string,
  newName: string,
  color?: string
): boolean {
  const proj = projects.find((p) => p.id === projectId);
  if (!proj) return false;
  proj.name = newName;
  if (color) proj.color = color;
  return true;
}

export function archiveProjectOp(
  projects: Project[],
  projectId: string
): boolean {
  const proj = projects.find((p) => p.id === projectId);
  if (!proj) return false;
  proj.archived = !proj.archived;
  return true;
}
