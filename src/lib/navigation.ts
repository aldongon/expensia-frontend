import type { ComponentType, SVGProps } from 'react';
import { LayoutDashboard } from 'lucide-react';

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
];
