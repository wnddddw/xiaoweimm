import { Project } from '../types';

export interface ProjectAssetItem {
  name: string;
  spec: string;
  qty: string;
  year: string;
  unit: string;
  value: string;
  images: string[];
}

export interface ProjectAssetGroups {
  equipment: ProjectAssetItem[];
  rawMaterial: ProjectAssetItem[];
  inventory: ProjectAssetItem[];
}

function normalizeText(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

function normalizeImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => normalizeText(item)).filter(Boolean);
}

function normalizeAssetItem(value: any): ProjectAssetItem {
  return {
    name: normalizeText(value?.name),
    spec: normalizeText(value?.spec),
    qty: normalizeText(value?.qty),
    year: normalizeText(value?.year),
    unit: normalizeText(value?.unit),
    value: normalizeText(value?.value ?? value?.price),
    images: normalizeImages(value?.images),
  };
}

function parseAssetList(raw: unknown): ProjectAssetItem[] {
  if (Array.isArray(raw)) {
    return raw.map(normalizeAssetItem).filter((item) => item.name || item.spec || item.qty || item.value || item.images.length > 0);
  }

  if (typeof raw !== 'string' || !raw.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeAssetItem).filter((item) => item.name || item.spec || item.qty || item.value || item.images.length > 0);
  } catch {
    return [];
  }
}

export function getProjectAssetGroups(project: Project): ProjectAssetGroups {
  return {
    equipment: parseAssetList(project.equipment),
    rawMaterial: parseAssetList(project.raw_material),
    inventory: parseAssetList(project.inventory),
  };
}

export function getProjectGallery(project: Project): string[] {
  const groups = getProjectAssetGroups(project);
  const seen = new Set<string>();
  const gallery: string[] = [];

  [groups.equipment, groups.rawMaterial, groups.inventory].forEach((items) => {
    items.forEach((item) => {
      item.images.forEach((image) => {
        if (!image || seen.has(image)) return;
        seen.add(image);
        gallery.push(image);
      });
    });
  });

  return gallery;
}

export function formatWan(value: number | undefined | null): string {
  return `¥${(value || 0).toLocaleString()}万`;
}
