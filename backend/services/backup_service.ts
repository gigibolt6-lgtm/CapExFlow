/**
 * Service to handle automatic backups of projects.json.
 */

import fs from 'fs/promises';
import path from 'path';

const BACKUP_DIR = path.join(process.cwd(), 'backend', 'backup');
const DATA_FILE = path.join(process.cwd(), 'backend', 'data', 'projects.json');

export async function createBackup(): Promise<string | null> {
  try {
    // Ensure backup directory exists
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    // Check if data file exists
    try {
      await fs.access(DATA_FILE);
    } catch {
      return null; // No file to backup yet
    }

    // Create timestamped filename
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[-:T]/g, '')
      .slice(0, 14); // YYYYMMDDHHMMSS
    const backupFile = path.join(BACKUP_DIR, `projects_${timestamp}.json`);

    // Copy file
    await fs.copyFile(DATA_FILE, backupFile);
    console.log(`Backup created: ${backupFile}`);
    return backupFile;
  } catch (error) {
    console.error('Failed to create backup:', error);
    return null;
  }
}
