import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Bed,
  Calendar,
  Users,
  UserCog,
  ChevronLeft,
  ChevronRight,
  Hotel,
  LogOut,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

const allNavigation = [
  { name: 'Dashboard', href: '/staff/dashboard', icon: LayoutDashboard },
  { name: 'Rooms', href: '/staff/rooms', icon: Bed },
  { name: 'Reservations', href: '/staff/reservations', icon: Calendar },
  { name: 'Guests', href: '/staff/guests', icon: Users },
  { name: 'Staff & Reports', href: '/staff/reports', icon: UserCog },
];

// Role-based navigation filtering
function getNavigationForRole(role?: string) {
  switch (role) {
    case 'Housekeeping':
      return allNavigation.filter(n => n.name === 'Rooms');
    case 'Accountant':
      return allNavigation.filter(n => n.name === 'Dashboard');
    case 'FrontDesk':
      return allNavigation.filter(n => ['Dashboard', 'Reservations', 'Guests'].includes(n.name));
    case 'Concierge':
      return allNavigation.filter(n => ['Dashboard', 'Guests'].includes(n.name));
    case 'ReservationAgent':
      return allNavigation.filter(n => ['Dashboard', 'Reservations', 'Rooms'].includes(n.name));
    case 'Manager':
    default:
      return allNavigation;
  }
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const navigation = getNavigationForRole(user?.staffData?.Role);

  const handleLogout = () => {
    logout();
    navigate('/staff-login');
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 z-50 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary/10 overflow-hidden">
          <img src="/website_logo.png" alt="Logo" className="h-full w-full object-contain" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="font-display text-lg font-semibold text-sidebar-foreground">
              HotelMS
            </h1>
            <p className="text-xs text-sidebar-foreground/60">Management System</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 flex-shrink-0 transition-transform duration-200",
                !isActive && "group-hover:scale-110"
              )} />
              {!collapsed && (
                <span className="font-medium animate-fade-in">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-3">
        {user && !collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 animate-fade-in">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary/20">
              <User className="h-4 w-4 text-sidebar-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.staffData?.First_Name} {user.staffData?.Last_Name}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user.staffData?.Role}
              </p>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-destructive/10 hover:text-destructive",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Logout</span>}
        </Button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

