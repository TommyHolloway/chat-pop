import { Deploy } from '../Deploy';

export const AgentDeployEmbed = ({ agent }: { agent: any }) => {
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Embed Widget</h2>
        <p className="text-muted-foreground">Get embed codes to add your agent to websites</p>
      </div>
      
      <Deploy />
    </div>
  );
};