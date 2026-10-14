// Buckets store a Tailwind-style class name in the DB (e.g. "bg-blue-100").
// The dashboard design uses solid accent colors, so map the stored value to a hex.
export const BUCKET_COLORS = [
  { name: 'Blue', value: 'bg-blue-100', hex: '#93c5fd' },
  { name: 'Purple', value: 'bg-purple-100', hex: '#c4b5fd' },
  { name: 'Pink', value: 'bg-pink-100', hex: '#f9a8d4' },
  { name: 'Red', value: 'bg-red-100', hex: '#fca5a5' },
  { name: 'Orange', value: 'bg-orange-100', hex: '#fdba74' },
  { name: 'Amber', value: 'bg-amber-100', hex: '#fcd34d' },
  { name: 'Green', value: 'bg-green-100', hex: '#86efac' },
  { name: 'Teal', value: 'bg-teal-100', hex: '#5eead4' },
];

export function bucketHex(value?: string): string {
  return BUCKET_COLORS.find(c => c.value === value)?.hex ?? '#c4b5fd';
}
