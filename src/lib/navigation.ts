import {
  ChartDonut,
  Receipt,
  ArrowsClockwise,
  Target,
  Tag,
  type Icon,
} from '@phosphor-icons/react';

export interface NavItem {
  label: string;
  href: string;
  icon: Icon;
}

export const navigation: NavItem[] = [
  { label: 'Resumen', href: '/resumen', icon: ChartDonut },
  { label: 'Gastos', href: '/gastos', icon: Receipt },
  { label: 'Recurrentes', href: '/recurrentes', icon: ArrowsClockwise },
  { label: 'Presupuesto', href: '/presupuesto', icon: Target },
  { label: 'Catálogos', href: '/catalogos', icon: Tag },
];
