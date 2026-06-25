import { useState, type ComponentType } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ClipboardList,
  LogOut,
  PenLine,
  Rocket,
  School,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Workspace",
    items: [
      { to: "/builder", label: "Builder", icon: PenLine },
      { to: "/assessments", label: "Assessments", icon: ClipboardList },
      { to: "/launch", label: "Launch Pad", icon: Rocket },
    ],
  },
  {
    label: "Insights",
    items: [{ to: "/reports", label: "Reports", icon: BarChart3 }],
  },
];

function initials(name?: string) {
  return (name?.trim().slice(0, 1) || "A").toUpperCase();
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  function handleLogout() {
    // Clear any token/user persisted in either storage, then drop context state.
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    logout(); // removes localStorage token/user + resets AuthContext
    navigate("/login");
  }

  const sidebarWidth = collapsed ? "lg:grid-cols-[72px_1fr]" : "lg:grid-cols-[248px_1fr]";

  return (
    <div className={cn("min-h-screen bg-background text-foreground lg:grid", sidebarWidth)}>
      <aside className="sticky top-0 hidden h-screen border-r bg-sidebar lg:flex lg:flex-col">
        <div className="sticky top-0 z-10 border-b bg-sidebar p-3">
          <div className="flex h-10 items-center gap-2">
            <div className="grid size-8 shrink-0 place-items-center rounded-xl border bg-card text-sidebar-foreground">
              <School className="size-4" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-5">Assessment</p>
                <p className="truncate text-xs text-muted-foreground">Management</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              className="ml-auto rounded-xl"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setCollapsed((value) => !value)}
            >
              {collapsed ? <ChevronRight /> : <ChevronLeft />}
            </Button>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-2">
              {!collapsed && (
                <p className="px-3 text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    title={collapsed ? label : undefined}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex h-10 items-center rounded-xl text-sm transition-[background-color,color] duration-150 ease-out active:scale-[0.99]",
                        collapsed ? "justify-center px-0" : "gap-3 px-3",
                        isActive
                          ? "bg-muted font-medium text-foreground"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={cn(
                            "absolute left-0 top-2 h-6 w-0.5 rounded-full bg-primary opacity-0 transition-opacity duration-150",
                            isActive && "opacity-100"
                          )}
                        />
                        <Icon className="size-4 shrink-0" />
                        {!collapsed && <span className="truncate">{label}</span>}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="sticky bottom-0 border-t bg-sidebar p-3">
          <UserMenu
            username={user?.username}
            onLogout={handleLogout}
            align={collapsed ? "center" : "start"}
            collapsed={collapsed}
          />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b bg-background px-4 lg:hidden">
          <div className="flex h-14 items-center gap-3">
            <div className="grid size-8 place-items-center rounded-xl border bg-card">
              <School className="size-4" />
            </div>
            <span className="font-semibold">Assessment</span>
            <div className="ml-auto">
              <UserMenu username={user?.username} onLogout={handleLogout} align="end" />
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden">
            {navGroups.flatMap((group) =>
              group.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "relative flex h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-sm transition-colors",
                      isActive
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          "absolute left-2 right-2 bottom-0 h-0.5 rounded-full bg-primary opacity-0",
                          isActive && "opacity-100"
                        )}
                      />
                      <Icon className="size-4" />
                      {label}
                    </>
                  )}
                </NavLink>
              ))
            )}
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function UserMenu({
  username,
  onLogout,
  align,
  collapsed = false,
}: {
  username?: string;
  onLogout: () => void;
  align: "start" | "center" | "end";
  collapsed?: boolean;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Open account menu"
          className={cn(
            "flex items-center rounded-xl outline-none transition-[background-color,transform] duration-150 ease-out focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.99]",
            collapsed
              ? "justify-center"
              : "w-full gap-2 border bg-card p-1.5 hover:bg-muted"
          )}
        >
          <Avatar className={cn(collapsed ? "border" : "size-8")}>
            <AvatarFallback className={cn(!collapsed && "text-xs")}>
              {initials(username)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium leading-tight">{username || "Account"}</p>
                <p className="truncate text-xs text-muted-foreground">Signed in</p>
              </div>
              <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
            </>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} side="top" className="min-w-56">
          <div className="flex items-center gap-2 p-2">
            <Avatar className="size-8 border">
              <AvatarFallback className="text-xs">{initials(username)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{username || "Account"}</p>
              <p className="truncate text-xs text-muted-foreground">Signed in</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
            <LogOut />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log out?</DialogTitle>
            <DialogDescription>
              You'll be returned to the login screen and will need to sign in again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={onLogout}>
              <LogOut />
              Log out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
