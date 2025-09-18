import React from 'react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { AuthenticatedNavbar } from './AuthenticatedNavbar';
import { BetaBanner } from '@/components/BetaBanner';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

export const WorkspaceLayout = ({ children }: WorkspaceLayoutProps) => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full">
      <WorkspaceSidebar />
      <SidebarInset className="flex flex-col flex-1">
        <AuthenticatedNavbar />
        <BetaBanner />
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </div>
  </SidebarProvider>
);