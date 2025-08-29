import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { WorkspaceOverview } from './workspace/sections/WorkspaceOverview';

export const Dashboard = () => {
  const { currentWorkspace, loading } = useWorkspaces();

  console.log('Dashboard: loading =', loading, 'currentWorkspace =', currentWorkspace);

  // Show loading state while fetching workspaces
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // If user has a current workspace, redirect to workspace dashboard
  if (currentWorkspace) {
    return <Navigate to={`/workspace/${currentWorkspace.id}`} replace />;
  }

  // If no workspace, show workspace selection/creation page
  return <WorkspaceOverview />;
};