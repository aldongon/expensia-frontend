import type { ComponentType, SVGProps } from 'react';
import { Coins, CreditCard, LayoutDashboard, ReceiptText, Repeat, Tags } from 'lucide-react';

type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

export interface NavLeafItem {
  label: string;
  headerTitle: string;
  href: string;
  icon: NavIcon;
}

export interface NavGroupItem {
  label: string;
  icon: NavIcon;
  children: NavLeafItem[];
}

export type NavItem = NavLeafItem | NavGroupItem;

export function isNavGroup(entry: NavItem): entry is NavGroupItem {
  return 'children' in entry;
}

export function flattenNavigation(entries: NavItem[] = navigation): NavLeafItem[] {
  return entries.flatMap((entry) => (isNavGroup(entry) ? entry.children : entry));
}

export function findNavigationItem(pathname: string) {
  return flattenNavigation().find(
    (entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`)
  );
}

export const navigation: NavItem[] = [
  {
    label: 'Dashboard',
    headerTitle: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Gastos',
    headerTitle: 'Gastos',
    href: '/expenses',
    icon: ReceiptText,
  },
  {
    label: 'Recurrentes',
    headerTitle: 'Recurrentes',
    href: '/recurring-expenses',
    icon: Repeat,
  },
  {
    label: 'Monedas',
    headerTitle: 'Monedas',
    href: '/currencies',
    icon: Coins,
  },
  {
    label: 'Tags',
    headerTitle: 'Tags',
    href: '/tags',
    icon: Tags,
  },
  {
    label: 'Métodos de pago',
    headerTitle: 'Métodos de pago',
    href: '/payment-methods',
    icon: CreditCard,
  },
];
