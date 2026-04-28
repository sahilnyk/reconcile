import { Outlet } from "react-router-dom";
import { SessionNavBar } from "./ui/sidebar";

export function AppShell() {
  return (
    <div className="flex h-screen">
      <SessionNavBar />

      <main className="flex-1 ml-[3.05rem] overflow-auto bg-background">
        <Outlet />
      </main>
    </div>
  );
}
