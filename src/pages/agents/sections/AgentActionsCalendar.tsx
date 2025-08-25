import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAgentActions } from '@/hooks/useAgentActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar, Save, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const AgentActionsCalendar = ({ agent }: { agent: any }) => {
  const { id } = useParams();
  const { actions, loading, createAction, updateAction } = useAgentActions(id);
  const [calendarConfig, setCalendarConfig] = useState({
    enabled: false,
    calendarUrl: '',
    meetingDuration: 30,
    meetingTitle: 'Meeting',
    timeZone: 'UTC',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const calendarAction = actions.find(action => action.action_type === 'calendar_booking');
    if (calendarAction) {
      setCalendarConfig({
        enabled: calendarAction.is_enabled,
        ...calendarAction.config_json,
      });
    }
  }, [actions]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const calendarAction = actions.find(action => action.action_type === 'calendar_booking');
      
      const actionData = {
        agent_id: id!,
        action_type: 'calendar_booking' as const,
        config_json: {
          calendarUrl: calendarConfig.calendarUrl,
          meetingDuration: calendarConfig.meetingDuration,
          meetingTitle: calendarConfig.meetingTitle,
          timeZone: calendarConfig.timeZone,
        },
        is_enabled: calendarConfig.enabled,
      };

      if (calendarAction) {
        await updateAction(calendarAction.id, {
          config_json: actionData.config_json,
          is_enabled: actionData.is_enabled,
        });
      } else {
        await createAction(actionData);
      }

      toast({
        title: "Success",
        description: "Calendar settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save calendar settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Calendar Booking</h2>
        <p className="text-muted-foreground">Allow users to book meetings through your agent</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Calendar Booking</Label>
              <p className="text-sm text-muted-foreground">
                Allow users to book meetings directly through the chat
              </p>
            </div>
            <Switch
              checked={calendarConfig.enabled}
              onCheckedChange={(enabled) => 
                setCalendarConfig(prev => ({ ...prev, enabled }))
              }
            />
          </div>

          {calendarConfig.enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="calendar-url">Calendar URL</Label>
                <Input
                  id="calendar-url"
                  value={calendarConfig.calendarUrl}
                  onChange={(e) => 
                    setCalendarConfig(prev => ({ ...prev, calendarUrl: e.target.value }))
                  }
                  placeholder="https://calendly.com/your-username"
                />
                <p className="text-sm text-muted-foreground">
                  Link to your Calendly, Cal.com, or other booking service
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meeting-duration">Default Duration (minutes)</Label>
                  <Input
                    id="meeting-duration"
                    type="number"
                    value={calendarConfig.meetingDuration}
                    onChange={(e) => 
                      setCalendarConfig(prev => ({ 
                        ...prev, 
                        meetingDuration: parseInt(e.target.value) || 30 
                      }))
                    }
                    min={15}
                    max={240}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time-zone">Time Zone</Label>
                  <select
                    id="time-zone"
                    value={calendarConfig.timeZone}
                    onChange={(e) => 
                      setCalendarConfig(prev => ({ ...prev, timeZone: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-input rounded-md"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meeting-title">Default Meeting Title</Label>
                <Input
                  id="meeting-title"
                  value={calendarConfig.meetingTitle}
                  onChange={(e) => 
                    setCalendarConfig(prev => ({ ...prev, meetingTitle: e.target.value }))
                  }
                  placeholder="Meeting with [Agent Name]"
                />
              </div>
            </>
          )}

          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Calendar Settings'}
          </Button>
        </CardContent>
      </Card>

      {calendarConfig.enabled && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm mb-3">When users request to book a meeting, your agent will:</p>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Offer to schedule a {calendarConfig.meetingDuration}-minute {calendarConfig.meetingTitle}</li>
                <li>Provide a link to your booking page: {calendarConfig.calendarUrl || 'your-calendar-url'}</li>
                <li>Show available times in {calendarConfig.timeZone} timezone</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};