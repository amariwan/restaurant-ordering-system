'use client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { getUser, parseRole } from '@/features/restaurant/lib/auth-store';
import { navGroups } from '@/config/nav-config';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useFilteredNavGroups } from '@/hooks/use-nav';
import { signOut } from '@/lib/auth/client';
import { useI18n } from '@/lib/i18n/context';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';

export default function AppSidebar() {
  const pathname = usePathname();
  const { isOpen } = useMediaQuery();
  const router = useRouter();
  const filteredGroups = useFilteredNavGroups(navGroups);
  const user = getUser();
  const role = parseRole();
  const { t, dir } = useI18n();
  const nav = t.nav as Record<string, string>;

  return (
    <Sidebar collapsible='icon' side={dir === 'rtl' ? 'right' : 'left'}>
      <SidebarHeader className='group-data-[collapsible=icon]:pt-4'>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' asChild>
              <Link href='/admin'>
                <div className='bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                  <Icons.pizza className='size-4' />
                </div>
                <div className='grid flex-1 text-start text-sm leading-tight'>
                  <span className='truncate font-semibold tracking-tight'>RestoOrder</span>
                  <span className='text-muted-foreground truncate text-xs'>Bestellsystem</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden'>
        {filteredGroups.map((group) => {
          const groupLabel = group.labelKey ? (nav[group.labelKey] ?? group.label) : group.label;
          return (
            <SidebarGroup key={group.label || 'ungrouped'} className='py-0'>
              {groupLabel && <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>}
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon ? Icons[item.icon as keyof typeof Icons] : Icons.logo;
                  const itemLabel = item.navKey ? (nav[item.navKey] ?? item.title) : item.title;
                  return item?.items && item?.items?.length > 0 ? (
                    <Collapsible
                      key={item.title}
                      asChild
                      defaultOpen={item.isActive}
                      className='group/collapsible'
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={itemLabel} isActive={pathname === item.url}>
                            {item.icon && <Icon />}
                            <span>{itemLabel}</span>
                            <Icons.chevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items?.map((subItem) => {
                              const subLabel = subItem.navKey ? (nav[subItem.navKey] ?? subItem.title) : subItem.title;
                              return (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                    <Link href={subItem.url}>
                                      <span>{subLabel}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  ) : (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        tooltip={itemLabel}
                        isActive={pathname === item.url}
                      >
                        <Link href={item.url}>
                          <Icon />
                          <span>{itemLabel}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  <Icons.user className='size-4 shrink-0' />
                  <div className='grid flex-1 text-start text-sm leading-tight'>
                    <span suppressHydrationWarning className='truncate font-semibold'>{user?.name || 'User'}</span>
                    <span suppressHydrationWarning className='truncate text-xs capitalize text-muted-foreground'>{role || '—'}</span>
                  </div>
                  <Icons.chevronsDown className='ms-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                side='bottom'
                align='end'
                sideOffset={4}
              >
                <DropdownMenuLabel className='p-0 font-normal'>
                  <div className='flex items-center gap-2 px-1 py-1.5 text-start text-sm'>
                    <Icons.user className='size-4 shrink-0' />
                    <div className='grid flex-1 text-start text-sm leading-tight'>
                      <span className='truncate font-semibold'>{user?.name || 'User'}</span>
                      <span className='truncate text-xs text-muted-foreground'>{user?.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <Icons.user className='me-2 h-4 w-4' />
                    {t.nav.profile}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Button
                    variant='ghost'
                    className='p-0 w-full h-auto justify-start text-destructive hover:text-destructive'
                    onClick={() => signOut({ redirectTo: '/' })}
                  >
                    <Icons.logout className='me-2 h-4 w-4' />
                    {t.nav.logout}
                  </Button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
