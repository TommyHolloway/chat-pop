import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Clock, MousePointer, Eye, ArrowLeft, ChevronRight } from 'lucide-react';
import { CustomTrigger } from '@/hooks/useProactiveConfig';

interface TriggerCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTrigger: (trigger: Omit<CustomTrigger, 'id'>) => void;
}

type TriggerType = 'time_based' | 'scroll_based' | 'element_interaction' | 'exit_intent';

interface TriggerTypeOption {
  value: TriggerType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const triggerTypes: TriggerTypeOption[] = [
  {
    value: 'time_based',
    label: 'Time Based',
    description: 'Show message after visitor spends time on page',
    icon: <Clock className="h-6 w-6" />
  },
  {
    value: 'scroll_based',
    label: 'Scroll Based',
    description: 'Show message when visitor scrolls down the page',
    icon: <MousePointer className="h-6 w-6" />
  },
  {
    value: 'element_interaction',
    label: 'Element Interaction',
    description: 'Show message when visitor interacts with specific elements',
    icon: <Eye className="h-6 w-6" />
  },
  {
    value: 'exit_intent',
    label: 'Exit Intent',
    description: 'Show message when visitor is about to leave the page',
    icon: <ArrowLeft className="h-6 w-6" />
  }
];

const STEPS = ['Type', 'Pages', 'Settings', 'Message'] as const;
type Step = typeof STEPS[number];

export const TriggerCreationWizard = ({ open, onOpenChange, onCreateTrigger }: TriggerCreationWizardProps) => {
  const [currentStep, setCurrentStep] = useState<Step>('Type');
  const [triggerData, setTriggerData] = useState<Partial<CustomTrigger>>({
    name: '',
    trigger_type: 'time_based',
    enabled: true,
    time_threshold: 30,
    scroll_depth: 50,
    url_patterns: [],
    message: 'Hi! I noticed you\'ve been browsing for a while. Can I help you find what you\'re looking for?'
  });

  const currentStepIndex = STEPS.indexOf(currentStep);
  const isLastStep = currentStepIndex === STEPS.length - 1;
  const isFirstStep = currentStepIndex === 0;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(STEPS[currentStepIndex + 1]);
    } else {
      handleCreate();
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(STEPS[currentStepIndex - 1]);
    }
  };

  const handleCreate = () => {
    if (!triggerData.name || !triggerData.message) return;
    
    onCreateTrigger({
      name: triggerData.name,
      trigger_type: triggerData.trigger_type!,
      enabled: true,
      time_threshold: triggerData.time_threshold || 30,
      scroll_depth: triggerData.scroll_depth || 50,
      element_selector: triggerData.element_selector || '',
      url_patterns: triggerData.url_patterns || [],
      message: triggerData.message
    });
    
    // Reset form
    setTriggerData({
      name: '',
      trigger_type: 'time_based',
      enabled: true,
      time_threshold: 30,
      scroll_depth: 50,
      url_patterns: [],
      message: 'Hi! I noticed you\'ve been browsing for a while. Can I help you find what you\'re looking for?'
    });
    setCurrentStep('Type');
    onOpenChange(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'Type':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Choose Trigger Type</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Select when you want your message to appear to visitors
              </p>
            </div>
            
            <div className="space-y-4">
              <Label htmlFor="trigger-name">Trigger Name</Label>
              <Input
                id="trigger-name"
                placeholder="e.g., Welcome Message, Pricing Help"
                value={triggerData.name}
                onChange={(e) => setTriggerData({ ...triggerData, name: e.target.value })}
              />
            </div>

            <RadioGroup
              value={triggerData.trigger_type}
              onValueChange={(value: TriggerType) => setTriggerData({ ...triggerData, trigger_type: value })}
            >
              <div className="grid grid-cols-1 gap-4">
                {triggerTypes.map((type) => (
                  <div key={type.value}>
                    <RadioGroupItem value={type.value} id={type.value} className="sr-only" />
                    <Label htmlFor={type.value} className="cursor-pointer">
                      <Card className="hover:bg-muted/50 transition-colors border-2 data-[state=checked]:border-primary">
                        <CardContent className="flex items-center gap-4 p-4">
                          <div className="text-primary">{type.icon}</div>
                          <div className="flex-1">
                            <h4 className="font-medium">{type.label}</h4>
                            <p className="text-sm text-muted-foreground">{type.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        );

      case 'Pages':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Target Pages</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Choose which pages this trigger should appear on
              </p>
            </div>

            <RadioGroup
              value={triggerData.url_patterns?.length ? 'specific' : 'all'}
              onValueChange={(value) => {
                if (value === 'all') {
                  setTriggerData({ ...triggerData, url_patterns: [] });
                } else {
                  setTriggerData({ ...triggerData, url_patterns: ['pricing'] });
                }
              }}
            >
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all-pages" />
                  <Label htmlFor="all-pages" className="flex-1 cursor-pointer">
                    <Card className="p-4">
                      <div>
                        <h4 className="font-medium">All Pages</h4>
                        <p className="text-sm text-muted-foreground">Show on every page of your website</p>
                      </div>
                    </Card>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="specific" id="specific-pages" />
                  <Label htmlFor="specific-pages" className="flex-1 cursor-pointer">
                    <Card className="p-4">
                      <div>
                        <h4 className="font-medium">Specific Pages</h4>
                        <p className="text-sm text-muted-foreground">Show only on certain pages or sections</p>
                      </div>
                    </Card>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            {triggerData.url_patterns?.length && (
              <div className="space-y-4 mt-6">
                <Label htmlFor="url-patterns">Page Names or Sections</Label>
                <Input
                  id="url-patterns"
                  placeholder="pricing, contact, about-us, product-demo"
                  value={triggerData.url_patterns?.join(', ') || ''}
                  onChange={(e) => setTriggerData({ 
                    ...triggerData, 
                    url_patterns: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Enter page names or sections separated by commas. For example: "pricing" will match any page with "pricing" in the URL.
                </p>
              </div>
            )}
          </div>
        );

      case 'Settings':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Trigger Settings</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Configure when exactly the trigger should activate
              </p>
            </div>

            {triggerData.trigger_type === 'time_based' && (
              <div className="space-y-4">
                <Label>Show message after {triggerData.time_threshold} seconds</Label>
                <Slider
                  value={[triggerData.time_threshold || 30]}
                  onValueChange={([value]) => setTriggerData({ ...triggerData, time_threshold: value })}
                  min={5}
                  max={120}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5 seconds</span>
                  <span>2 minutes</span>
                </div>
              </div>
            )}

            {triggerData.trigger_type === 'scroll_based' && (
              <div className="space-y-4">
                <Label>Show message when visitor scrolls {triggerData.scroll_depth}% down the page</Label>
                <Slider
                  value={[triggerData.scroll_depth || 50]}
                  onValueChange={([value]) => setTriggerData({ ...triggerData, scroll_depth: value })}
                  min={10}
                  max={90}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>10%</span>
                  <span>90%</span>
                </div>
              </div>
            )}

            {triggerData.trigger_type === 'element_interaction' && (
              <div className="space-y-4">
                <Label htmlFor="element-selector">Element Selector (CSS)</Label>
                <Input
                  id="element-selector"
                  placeholder=".button, #signup, [data-pricing]"
                  value={triggerData.element_selector || ''}
                  onChange={(e) => setTriggerData({ ...triggerData, element_selector: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  CSS selector for the element to watch. Examples: ".button", "#signup", "[data-pricing]"
                </p>
              </div>
            )}

            {triggerData.trigger_type === 'exit_intent' && (
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  Exit intent triggers activate when the visitor moves their mouse toward the browser's close button or address bar, indicating they're about to leave.
                </p>
              </div>
            )}
          </div>
        );

      case 'Message':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Trigger Message</h3>
              <p className="text-sm text-muted-foreground mb-6">
                What message should visitors see when this trigger activates?
              </p>
            </div>

            <div className="space-y-4">
              <Label htmlFor="trigger-message">Message</Label>
              <Textarea
                id="trigger-message"
                placeholder="Hi! I noticed you've been browsing for a while. Can I help you find what you're looking for?"
                value={triggerData.message}
                onChange={(e) => setTriggerData({ ...triggerData, message: e.target.value })}
                rows={4}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Keep it friendly and helpful. This will be the first thing visitors see.
                </p>
                <span className="text-xs text-muted-foreground">
                  {triggerData.message?.length || 0} characters
                </span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'Type':
        return triggerData.name && triggerData.trigger_type;
      case 'Pages':
        return true; // Always can proceed from pages
      case 'Settings':
        if (triggerData.trigger_type === 'element_interaction') {
          return triggerData.element_selector;
        }
        return true;
      case 'Message':
        return triggerData.message;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Trigger</DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {STEPS.map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${index <= currentStepIndex 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
                }
              `}>
                {index + 1}
              </div>
              <span className={`ml-2 text-sm ${index <= currentStepIndex ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step}
              </span>
              {index < STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 mx-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isFirstStep}
          >
            Back
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {isLastStep ? 'Create Trigger' : 'Next'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};