export type UserRole = 'owner' | 'manager' | 'cashier' | 'admin' | 'superadmin';

export interface MenuPermission {
  key: string;
  roles: UserRole[];
}

export const MENU_PERMISSIONS: MenuPermission[] = [
  // Dashboard
  {
    key: 'dashboard',
    roles: ['owner', 'manager', 'cashier', 'admin', 'superadmin']
  },
  
  // Transaction
  {
    key: 'transaction',
    roles: ['owner', 'manager', 'cashier', 'admin', 'superadmin']
  },
  
  // Reports
  {
    key: 'reports',
    roles: ['owner', 'manager', 'admin', 'superadmin']
  },
  
  // Products
  {
    key: 'products',
    roles: ['owner', 'manager', 'admin', 'superadmin']
  },
  
  // Categories
  {
    key: 'categories',
    roles: ['owner', 'manager', 'admin', 'superadmin']
  },
  
  // Customers
  {
    key: 'customers',
    roles: ['owner', 'manager', 'admin', 'superadmin']
  },
  
  // Suppliers
  {
    key: 'suppliers',
    roles: ['owner', 'manager', 'admin', 'superadmin']
  },
  
  // Employee Management
  {
    key: 'employees',
    roles: ['owner', 'admin', 'superadmin']
  },
  
  // Outlet Management
  {
    key: 'outlets',
    roles: ['owner', 'admin', 'superadmin']
  },
  
  // General Settings
  {
    key: 'settings',
    roles: ['owner', 'manager', 'cashier', 'admin', 'superadmin']
  },
  
  // Scanner
  {
    key: 'scanner',
    roles: ['owner', 'manager', 'cashier', 'admin', 'superadmin']
  },
  
  // Receipt
  {
    key: 'receipt',
    roles: ['owner', 'manager', 'cashier', 'admin', 'superadmin']
  },
  
  // Printer
  {
    key: 'printer',
    roles: ['owner', 'manager', 'cashier', 'admin', 'superadmin']
  }
];

export const ROLE_HIERARCHY: Record<string, number> = {
  superadmin: 5,
  admin: 4,
  owner: 3,
  user: 3,
  manager: 2,
  cashier: 1
};

export function normalizeRole(role?: string | null): UserRole {
  if (!role) return 'owner';
  const lower = role.toLowerCase().trim();
  if (lower === 'superadmin') return 'superadmin';
  if (lower === 'admin') return 'admin';
  if (lower === 'manager') return 'manager';
  if (lower === 'cashier') return 'cashier';
  if (lower === 'user' || lower === 'owner') return 'owner';
  return 'owner';
}

export function hasPermission(rawUserRole?: string | null, menuKey?: string): boolean {
  if (!menuKey) return true;
  const role = normalizeRole(rawUserRole);
  if (role === 'superadmin' || role === 'admin') return true;
  const permission = MENU_PERMISSIONS.find(p => p.key === menuKey);
  if (!permission) return true;
  return permission.roles.includes(role);
}

export function canAccessRole(requiredRole: UserRole, rawUserRole?: string | null): boolean {
  const role = normalizeRole(rawUserRole);
  return (ROLE_HIERARCHY[role] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
}

