import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge"
import { useAuth0 } from "@auth0/auth0-react";
import {
  ChevronsUpDown,
  FileClock,
  LayoutDashboard,
  LogOut,
  MessagesSquare,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

const sidebarVariants = {
  open: {
    width: "15rem",
  },
  closed: {
    width: "3.05rem",
  },
};

const contentVariants = {
  open: { display: "block", opacity: 1 },
  closed: { display: "block", opacity: 1 },
};

const variants = {
  open: {
    x: 0,
    opacity: 1,
    transition: {
      x: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    x: -20,
    opacity: 0,
    transition: {
      x: { stiffness: 100 },
    },
  },
};

const transitionProps = {
  type: "tween" as const,
  ease: "easeOut" as const,
  duration: 0.2,
  staggerChildren: 0.1,
};

const staggerVariants = {
  open: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
};

export function SessionNavBar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const location = useLocation();
  const pathname = location.pathname;
  const { user, logout } = useAuth0();

  // Get user initials for avatar
  const getInitials = (name: string | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const userName = user?.name || user?.nickname || "User";
  const userEmail = user?.email || "";
  const userInitials = getInitials(userName);

  return (
    <motion.div
      className={cn(
        "sidebar fixed left-0 z-40 h-full shrink-0 border-r",
      )}
      initial={isCollapsed ? "closed" : "open"}
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarVariants}
      transition={transitionProps}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <motion.div
        className={`relative z-40 flex text-muted-foreground h-full shrink-0 flex-col bg-background transition-all`}
        variants={contentVariants}
      >
        <motion.ul variants={staggerVariants} className="flex h-full flex-col">
          {/* App Logo */}
          <div className="flex h-14 w-full shrink-0 border-b items-center justify-center">
            <motion.div
              className="flex items-center justify-center"
              animate={{
                scale: isCollapsed ? 1 : 2
              }}
              transition={{ duration: 0.2 }}
            >
              <img
                src="/reconcile-logo.png"
                alt="Reconcile"
                className="h-8 w-8 object-contain"
              />
            </motion.div>
          </div>

          {/* Navigation */}
          <div className="flex flex-1 w-full flex-col min-h-0">
            <div className="flex grow flex-col gap-4">
              <ScrollArea className="h-16 grow p-2">
                <div className={cn("flex w-full flex-col gap-1")}>
                  <Link
                    to="/app"
                    className={cn(
                      "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                      pathname === "/app" && "bg-muted text-blue-600",
                    )}
                  >
                    <LayoutDashboard className="h-4 w-4 shrink-0" />
                    <motion.li variants={variants} className="flex items-center overflow-hidden">
                      {!isCollapsed && (
                        <p className="ml-2 text-sm font-medium truncate">Dashboard</p>
                      )}
                    </motion.li>
                  </Link>
                  <Link
                    to="/app/invoices"
                    className={cn(
                      "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                      pathname?.includes("invoices") && "bg-muted text-blue-600",
                    )}
                  >
                    <FileClock className="h-4 w-4 shrink-0" />
                    <motion.li variants={variants} className="flex items-center overflow-hidden">
                      {!isCollapsed && (
                        <p className="ml-2 text-sm font-medium truncate">Invoices</p>
                      )}
                    </motion.li>
                  </Link>
                  <Link
                    to="/app/query"
                    className={cn(
                      "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                      pathname?.includes("query") && "bg-muted text-blue-600",
                    )}
                  >
                    <MessagesSquare className="h-4 w-4 shrink-0" />
                    <motion.li variants={variants} className="flex items-center overflow-hidden">
                      {!isCollapsed && (
                        <div className="ml-2 flex items-center gap-2 overflow-hidden">
                          <p className="text-sm font-medium truncate">Ask AI</p>
                          <Badge
                            className="shrink-0 flex h-fit w-fit items-center gap-1.5 rounded border-none bg-blue-50 px-1.5 text-blue-600 text-[10px]"
                            variant="outline"
                          >
                            BETA
                          </Badge>
                        </div>
                      )}
                    </motion.li>
                  </Link>
                  <Separator className="w-full" />
                </div>
              </ScrollArea>
            </div>
            {/* User Account */}
            <div className="flex flex-col p-2 border-t">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger className="w-full">
                  <div className="flex h-8 w-full flex-row items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary">
                    <Avatar className="h-6 w-6 rounded-full shrink-0">
                      {user?.picture ? (
                        <img src={user.picture} alt={userName} className="h-full w-full rounded-full object-cover" />
                      ) : (
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">{userInitials}</AvatarFallback>
                      )}
                    </Avatar>
                    <motion.li
                      variants={variants}
                      className="flex flex-1 items-center gap-2 overflow-hidden"
                    >
                      {!isCollapsed && (
                        <>
                          <p className="text-sm font-medium truncate">{userName}</p>
                          <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground/50 shrink-0" />
                        </>
                      )}
                    </motion.li>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent sideOffset={5} align="start" className="w-56">
                  <div className="flex flex-row items-center gap-2 p-2">
                    <Avatar className="h-8 w-8 rounded-full">
                      {user?.picture ? (
                        <img src={user.picture} alt={userName} className="h-full w-full rounded-full object-cover" />
                      ) : (
                        <AvatarFallback className="text-sm bg-primary text-primary-foreground">{userInitials}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex flex-col text-left overflow-hidden">
                      <span className="text-sm font-medium truncate">
                        {userName}
                      </span>
                      <span className="line-clamp-1 text-xs text-muted-foreground truncate">
                        {userEmail}
                      </span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                    onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.ul>
      </motion.div>
    </motion.div>
  );
}
