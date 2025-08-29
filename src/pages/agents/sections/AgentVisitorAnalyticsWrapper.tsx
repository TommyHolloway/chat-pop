import { PlanEnforcementWrapper } from '@/components/PlanEnforcementWrapper';
import { AgentVisitorAnalytics } from './AgentVisitorAnalytics';

interface AgentVisitorAnalyticsWrapperProps {
  agent: any;
}

export const AgentVisitorAnalyticsWrapper = ({ agent }: AgentVisitorAnalyticsWrapperProps) => {
  return (
    <PlanEnforcementWrapper feature="visitor_analytics">
      <AgentVisitorAnalytics agent={agent} />
    </PlanEnforcementWrapper>
  );
};