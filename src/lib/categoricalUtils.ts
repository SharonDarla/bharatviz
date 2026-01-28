export type DataType = 'numerical' | 'categorical';

export interface CategoryColorMapping {
  [category: string]: string;
}

export function detectDataType(values: (number | string)[]): DataType {
  if (values.length === 0) return 'numerical';

  const numericCount = values.filter(v => typeof v === 'number' && !isNaN(v)).length;
  const stringCount = values.filter(v => typeof v === 'string' && v.trim() !== '').length;

  if (stringCount > numericCount) {
    return 'categorical';
  }

  const validValues = values.filter(v => {
    if (v === null || v === undefined) return false;
    if (typeof v === 'string' && v.trim() === '') return false;
    if (typeof v === 'number' && isNaN(v)) return false;
    return true;
  });

  const uniqueValues = new Set(validValues);
  if (uniqueValues.size <= 10 && stringCount > 0) {
    return 'categorical';
  }

  return 'numerical';
}

export function getUniqueCategories(values: (number | string)[]): string[] {
  const categories = new Set<string>();
  values.forEach(v => {
    if (v !== null && v !== undefined && v !== '' && !(typeof v === 'number' && isNaN(v))) {
      categories.add(String(v));
    }
  });
  return Array.from(categories).sort();
}

const DEFAULT_PALETTE = [
  '#e74c3c', // red
  '#3498db', // blue
  '#2ecc71', // green
  '#f39c12', // orange
  '#9b59b6', // purple
  '#1abc9c', // turquoise
  '#e67e22', // carrot
  '#95a5a6', // gray
  '#34495e', // dark blue-gray
  '#e91e63', // pink
  '#00bcd4', // cyan
  '#4caf50', // light green
  '#ff9800', // amber
  '#673ab7', // deep purple
  '#009688', // teal
];

export function generateDefaultCategoryColors(categories: string[]): CategoryColorMapping {
  const mapping: CategoryColorMapping = {};
  categories.forEach((category, index) => {
    mapping[category] = DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
  });
  return mapping;
}

export function getCategoryColor(category: string, mapping: CategoryColorMapping, defaultColor: string = '#cccccc'): string {
  return mapping[category] || defaultColor;
}

export function getColorForCategoricalValue(
  value: number | string | undefined,
  dataType: DataType,
  categoryColors: CategoryColorMapping
): string | null {
  if (dataType !== 'categorical' || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return null;
  }

  return getCategoryColor(value, categoryColors);
}
