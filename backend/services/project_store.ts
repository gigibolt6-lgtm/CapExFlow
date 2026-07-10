/**
 * Service to manage loading and saving of the projects.json file.
 */

import fs from 'fs/promises';
import path from 'path';
import { ProjectsData, Project } from '../models/project_schema.ts';
import { createBackup } from './backup_service.ts';

const DATA_DIR = path.join(process.cwd(), 'backend', 'data');
const DATA_FILE = path.join(DATA_DIR, 'projects.json');

const INITIAL_DATA: ProjectsData = {
  app: {
    name: "設備導入稟議作成アプリ",
    version: "0.1.0",
    schemaVersion: "0.1.0"
  },
  projects: []
};

export async function initStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await saveStore(INITIAL_DATA);
  }
}

export async function loadStore(): Promise<ProjectsData> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load store, returning initial data:', error);
    return INITIAL_DATA;
  }
}

export async function saveStore(data: ProjectsData) {
  try {
    // Always backup before saving
    await createBackup();

    await fs.mkdir(DATA_DIR, { recursive: true });
    // Save with indentation for readability
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save store:', error);
    throw error;
  }
}

export async function getProjectById(projectId: string): Promise<Project | undefined> {
  const data = await loadStore();
  return data.projects.find(p => p.meta.projectId === projectId);
}
