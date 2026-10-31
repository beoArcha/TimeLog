import { Project } from '@bindings/Project';

export function addProjectOp(
  projects: Project[],
  nextId: string,
  name: string,
  color = 'indigo',
  hourlyRate?: string | null,
  currency?: string | null
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
    hourlyRate: hourlyRate ?? null,
    currency: currency ?? null,
  };
  projects.push(newProject);
  return newProject;
}

export function renameProjectOp(
  projects: Project[],
  projectId: string,
  newName: string,
  color?: string,
  hourlyRate?: string | null,
  currency?: string | null
): boolean {
  const proj = projects.find((p) => p.id === projectId);
  if (!proj) return false;
  proj.name = newName;
  if (color) proj.color = color;
  if (hourlyRate !== undefined) proj.hourlyRate = hourlyRate;
  if (currency !== undefined) proj.currency = currency;
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
