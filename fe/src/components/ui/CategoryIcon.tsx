import {
  Backpack,
  BookOpen,
  FileText,
  FolderOpen,
  Laptop,
  Package,
  Paintbrush,
  Palette,
  Pencil,
  type LucideIcon,
} from 'lucide-react';

const iconsByCategory: Record<string, LucideIcon> = {
  cuadernos: BookOpen,
  lapices: Pencil,
  escritura: Pencil,
  colores: Palette,
  arte: Paintbrush,
  oficina: FolderOpen,
  mochilas: Backpack,
  tecnologia: Laptop,
  papeleria: FileText,
};

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/** Ícono consistente (lucide) para una categoría de producto. */
export default function CategoryIcon({ category, size = 26 }: { category?: string | null; size?: number }) {
  const Icon = iconsByCategory[normalize(category ?? '')] ?? Package;
  return <Icon size={size} strokeWidth={1.75} aria-hidden="true" />;
}
