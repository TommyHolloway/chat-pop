import { Playground } from '../Playground';

export const AgentPlayground = ({ agent }: { agent: any }) => {
  return (
    <div className="fixed inset-0 z-50 bg-background">
      <Playground />
    </div>
  );
};