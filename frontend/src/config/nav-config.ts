import { NavGroup } from '@/types';

export const navGroups: NavGroup[] = [
  {
    label: 'Operations',
    labelKey: 'operations',
    items: [
      {
        title: 'Dashboard',
        navKey: 'dashboard',
        url: '/dashboard',
        icon: 'dashboard',
        isActive: false,
      },
      {
        title: 'Orders',
        navKey: 'orders',
        url: '/orders',
        icon: 'post',
        isActive: false,
      },
      {
        title: 'Cart',
        navKey: 'cart',
        url: '/cart',
        icon: 'cart',
        isActive: false,
      },
      {
        title: 'Menu',
        navKey: 'menu',
        url: '/menu',
        icon: 'pizza',
        isActive: false,
      },
      {
        title: 'Tables',
        navKey: 'tables',
        url: '/admin/tables',
        icon: 'table',
        isActive: false,
      }
    ]
  },
  {
    label: 'Kitchen',
    labelKey: 'kitchen',
    items: [
      {
        title: 'Kitchen View',
        navKey: 'kitchenView',
        url: '/kitchen',
        icon: 'chefHat',
        isActive: false,
      },
      {
        title: 'Manage Menu',
        navKey: 'manageMenu',
        url: '/admin/menu',
        icon: 'product',
        isActive: false,
      }
    ]
  },
  {
    label: 'Administration',
    labelKey: 'administration',
    items: [
      {
        title: 'Users',
        navKey: 'users',
        url: '/admin/users',
        icon: 'teams',
        isActive: false,
      },
      {
        title: 'Reservations',
        navKey: 'reservations',
        url: '/reservations',
        icon: 'calendar',
        isActive: false,
      }
    ]
  }
];

