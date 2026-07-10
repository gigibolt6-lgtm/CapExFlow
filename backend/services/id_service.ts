/**
 * Service to generate unique IDs for projects and units.
 */

export function generateProjectId(): string {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[-:T]/g, '').slice(0, 14); // YYYYMMDDHHMMSS
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `prj_${dateStr}_${random}`;
}

export function generateUnitId(): string {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[-:T]/g, '').slice(0, 14); // YYYYMMDDHHMMSS
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `unit_${dateStr}_${random}`;
}
