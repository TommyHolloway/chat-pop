import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useAgents } from '@/hooks/useAgents';
import { useAgentLinks } from '@/hooks/useAgentLinks';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Step1_LinkInput } from './Step1_LinkInput';
import { Step2_CrawlingProgress } from './Step2_CrawlingProgress';
import { Step3_UICustomization } from './Step3_UICustomization';
import { Step4_QuickTriggersSetup } from './Step4_QuickTriggersSetup';
import { Step5_ShopifyConnection } from './Step5_ShopifyConnection';

interface BrandInfo {
  businessName: string;
  businessDescription: string;
  suggestedInstructions: string;
  suggestedInitialMessage: string;
}

export const AgentOnboardingWizard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspaces();
  const { createAgent } = useAgents();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [useCase, setUseCase] = useState<'general' | 'customer_support' | 'sales'>('sales');
  const [brandInfo, setBrandInfo] = useState<BrandInfo | null>(null);
  const [isEcommerceDetected, setIsEcommerceDetected] = useState(false);
  const [progressState, setProgressState] = useState({
    links: 'pending' as 'pending' | 'processing' | 'completed',
    prompt: 'pending' as 'pending' | 'processing' | 'completed',
    knowledgeBase: 'pending' as 'pending' | 'processing' | 'completed'
  });
  
  const [agentName, setAgentName] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [messageBubbleColor, setMessageBubbleColor] = useState('#3B82F6');
  const [chatInterfaceTheme, setChatInterfaceTheme] = useState<'light' | 'dark' | 'auto'>('dark');
  const [instructions, setInstructions] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [enabledQuickTriggers, setEnabledQuickTriggers] = useState<string[]>([
    'product_page_hesitation',
    'compare_products',
    'checkout_exit'
  ]);
  
  const [agentId, setAgentId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAddingToKnowledgeBase, setIsAddingToKnowledgeBase] = useState(false);
  const [knowledgeBaseCrawlStatus, setKnowledgeBaseCrawlStatus] = useState<'pending' | 'in_progress' | 'completed' | 'failed'>('pending');
  const [crawlProgress, setCrawlProgress] = useState({ pagesProcessed: 0, pagesFound: 0 });
  const [currentLinkId, setCurrentLinkId] = useState<string | null>(null);
  const [crawlError, setCrawlError] = useState<string | null>(null);
  
  const agentLinksHook = useAgentLinks(agentId || undefined);

  // Auto-advance to Step 3 when knowledge base is completed
  useEffect(() => {
    if (currentStep === 2 && knowledgeBaseCrawlStatus === 'completed') {
      toast({
        title: "Website Analysis Complete",
        description: "All pages have been successfully crawled and added to the knowledge base.",
      });
      
      setTimeout(() => {
        setCurrentStep(3);
      }, 1500);
    }
  }, [currentStep, knowledgeBaseCrawlStatus, toast]);

  // Real-time subscription for crawl progress
  useEffect(() => {
    if (!currentLinkId) return;

    console.log('Setting up real-time subscription for link:', currentLinkId);

    const channel = supabase
      .channel('agent_links_progress')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'agent_links',
          filter: `id=eq.${currentLinkId}`
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          const newData = payload.new as any;
          
          if (newData.pages_found !== undefined && newData.pages_processed !== undefined) {
            setCrawlProgress({
              pagesProcessed: newData.pages_processed,
              pagesFound: newData.pages_found
            });
          }

          // Check if crawl completed
          if (newData.status === 'completed') {
            setKnowledgeBaseCrawlStatus('completed');
            setProgressState(prev => ({ ...prev, knowledgeBase: 'completed' }));
            setCrawlError(null);
          } else if (newData.status === 'failed') {
            setKnowledgeBaseCrawlStatus('failed');
            setProgressState(prev => ({ ...prev, knowledgeBase: 'completed' }));
            setCrawlError(newData.error_message || 'Crawl failed. Please try again.');
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [currentLinkId]);

  const handleStartCrawling = async () => {
    setCurrentStep(2);
    setIsProcessing(true);
    
    try {
      setProgressState(prev => ({ ...prev, links: 'processing' }));
      
      const { data: crawlData, error: crawlError } = await supabase.functions.invoke('crawl-url', {
        body: {
          url: `https://${websiteUrl}`,
          crawlMode: 'scrape',
          maxPages: 1
        }
      });
      
      if (crawlError) throw crawlError;
      if (!crawlData?.success) {
        throw new Error(crawlData?.error || 'Failed to analyze website');
      }
      
      setProgressState(prev => ({ ...prev, links: 'completed', prompt: 'processing' }));
      
      const { data: brandData, error: brandError } = await supabase.functions.invoke('extract-brand-info', {
        body: {
          url: `https://${websiteUrl}`,
          content: crawlData.markdown || '',
          useCase
        }
      });
      
      if (brandError) throw brandError;
      
      setBrandInfo(brandData);
      setAgentName(brandData.businessName);
      setInstructions(brandData.suggestedInstructions);
      setInitialMessage(brandData.suggestedInitialMessage);
      
      // Detect e-commerce indicators in crawled content
      const content = (crawlData.markdown || '').toLowerCase();
      const ecommerceKeywords = [
        'add to cart', 'buy now', 'shop', 'checkout', 'product', 'price',
        'shopping cart', 'myshopify', 'shopify', 'woocommerce', 'ecommerce',
        'store', 'purchase', 'order', 'shipping', 'payment'
      ];
      const isEcommerce = ecommerceKeywords.some(keyword => content.includes(keyword)) || 
                          websiteUrl.includes('.myshopify.com');
      setIsEcommerceDetected(isEcommerce);
      console.log('E-commerce detected:', isEcommerce);
      
      // Set defaults for user to customize in Step 3
      setProfileImageUrl(null);
      setMessageBubbleColor('#3B82F6');
      
      setProgressState({
        links: 'completed',
        prompt: 'completed',
        knowledgeBase: 'pending'
      });
      
      setTimeout(() => {
        setIsProcessing(false);
        handleCreateAgent();
      }, 1000);
      
    } catch (error) {
      console.error('Crawling error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to analyze your website. Please try again.";
      toast({
        title: "Website Analysis Failed",
        description: errorMessage,
        variant: "destructive"
      });
      setIsProcessing(false);
      setProgressState({
        links: 'pending',
        prompt: 'pending',
        knowledgeBase: 'pending'
      });
      setCurrentStep(1);
    }
  };

  const handleCreateAgent = async () => {
    if (!currentWorkspace) return;
    
    setIsProcessing(true);
    
    try {
      const newAgent = await createAgent({
        name: agentName,
        description: brandInfo?.businessDescription || '',
        instructions: instructions,
        workspace_id: currentWorkspace.id,
        initial_message: initialMessage,
        creativity_level: 5,
        profile_image_url: profileImageUrl,
        message_bubble_color: messageBubbleColor,
        chat_interface_theme: chatInterfaceTheme,
      });
      
      setAgentId(newAgent.id);
      setIsProcessing(false);
      
      // Automatically add website to knowledge base
      await handleAddToKnowledgeBase(newAgent.id);
      
      // Don't advance to step 3 yet - wait for knowledge base to complete
      
    } catch (error) {
      console.error('Agent creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create agent. Please try again.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const handleAddToKnowledgeBase = async (agentIdParam: string) => {
    const targetAgentId = agentIdParam || agentId;
    if (!targetAgentId || !websiteUrl) return;
    
    setIsAddingToKnowledgeBase(true);
    setKnowledgeBaseCrawlStatus('in_progress');
    setProgressState(prev => ({ ...prev, knowledgeBase: 'processing' }));
    
    try {
      console.log('Adding website to knowledge base:', websiteUrl);
      
      // Insert the link into agent_links first to get the ID
      const { data: linkData, error: linkError } = await supabase
        .from('agent_links')
        .insert({
          agent_id: targetAgentId,
          url: `https://${websiteUrl}`,
          status: 'pending',
          crawl_mode: 'crawl',
          crawl_limit: 50
        })
        .select()
        .single();

      if (linkError) throw linkError;
      
      // Store the link ID for real-time tracking
      setCurrentLinkId(linkData.id);
      console.log('Link created, starting crawl:', linkData.id);
      
      // Start the crawl asynchronously (don't await - let it run in background)
      agentLinksHook.crawlLink(linkData.id, `https://${websiteUrl}`, 'crawl', 50);
      
      toast({
        title: "Crawling Started",
        description: "Your website is being crawled and added to the knowledge base.",
      });
      
    } catch (error) {
      console.error('Error adding to knowledge base:', error);
      setKnowledgeBaseCrawlStatus('failed');
      setProgressState(prev => ({ ...prev, knowledgeBase: 'completed' }));
      toast({
        title: "Warning",
        description: "Website crawl may have failed, but you can add it manually later.",
        variant: "destructive",
      });
    } finally {
      setIsAddingToKnowledgeBase(false);
    }
  };

  const handleSaveUICustomization = async () => {
    if (!agentId) return;
    
    setIsProcessing(true);
    
    try {
      const { error } = await supabase
        .from('agents')
        .update({
          name: agentName,
          profile_image_url: profileImageUrl,
          message_bubble_color: messageBubbleColor,
          chat_interface_theme: chatInterfaceTheme,
          initial_message: initialMessage
        })
        .eq('id', agentId);
      
      if (error) throw error;
      
      setIsProcessing(false);
      setCurrentStep(5);
      
    } catch (error) {
      console.error('Error updating agent UI:', error);
      toast({
        title: "Error",
        description: "Failed to update agent appearance.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const handleSaveQuickTriggers = async () => {
    if (!agentId) return;
    
    setIsProcessing(true);
    
    try {
      const quickTriggerTemplates = [
        {
          id: 'product_page_hesitation',
          name: 'Product Page Hesitation',
          trigger_type: 'time_based',
          enabled: enabledQuickTriggers.includes('product_page_hesitation'),
          time_threshold: 45,
          message: "👋 Still deciding? I can help with sizing, shipping times, or answer any questions!",
          url_patterns: ['/products/*', '/product/*'],
          isQuickTrigger: true
        },
        {
          id: 'compare_products',
          name: 'Comparing Multiple Products',
          trigger_type: 'behavior_based',
          enabled: enabledQuickTriggers.includes('compare_products'),
          page_views_threshold: 3,
          message: "Comparing options? 🤔 I can help you find the perfect match!",
          url_patterns: ['/products/*'],
          isQuickTrigger: true
        },
        {
          id: 'checkout_exit',
          name: 'Checkout Exit Intent',
          trigger_type: 'time_based',
          enabled: enabledQuickTriggers.includes('checkout_exit'),
          time_threshold: 60,
          message: "Need help completing your order? I can answer questions or apply a discount! 💬",
          url_patterns: ['/checkout', '/cart'],
          isQuickTrigger: true
        },
        {
          id: 'quick_cart_abandonment',
          name: 'Cart Abandonment Recovery',
          trigger_type: 'time_based',
          enabled: enabledQuickTriggers.includes('quick_cart_abandonment'),
          time_threshold: 300,
          message: "Your cart is waiting! 🛒 Got questions or need help with checkout?",
          url_patterns: ['/cart'],
          isQuickTrigger: true
        }
      ];
      
      const proactiveConfig = {
        enabled: enabledQuickTriggers.length > 0,
        timing_delay: 5000,
        frequency_limit: 3,
        message_display_duration: 15000,
        custom_triggers: quickTriggerTemplates,
        triggers: {
          pricing_concern: { enabled: false, message: '' },
          high_engagement: { enabled: false, message: '' },
          feature_exploration: { enabled: false, message: '' }
        }
      };
      
      const { error } = await supabase
        .from('agents')
        .update({
          enable_proactive_engagement: enabledQuickTriggers.length > 0,
          proactive_config: proactiveConfig
        })
        .eq('id', agentId);
      
      if (error) throw error;
      
      setIsProcessing(false);
      
      // Conditionally skip Shopify step if not e-commerce
      if (!isEcommerceDetected) {
        console.log('Non-e-commerce site detected, skipping Shopify connection');
        handleSkipShopify();
      } else {
        setCurrentStep(5);
      }
      
    } catch (error) {
      console.error('Error saving quick triggers:', error);
      toast({
        title: "Error",
        description: "Failed to save quick triggers.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const handleSkipShopify = () => {
    setCurrentStep(6);
    
    toast({
      title: "🎉 Agent created successfully!",
      description: "Your AI shopping assistant is ready to deploy.",
    });
    
    setTimeout(() => {
      navigate(`/workspace/${currentWorkspace?.id}/agents/${agentId}/deploy/embed`);
    }, 2000);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1_LinkInput
            websiteUrl={websiteUrl}
            setWebsiteUrl={setWebsiteUrl}
            useCase={useCase}
            setUseCase={setUseCase}
            onNext={handleStartCrawling}
          />
        );
      case 2:
        return (
          <Step2_CrawlingProgress
            websiteUrl={websiteUrl}
            agentId={agentId}
            progressState={progressState}
            crawlProgress={crawlProgress}
            linkId={currentLinkId}
            crawlError={crawlError}
          />
        );
      case 3:
        return (
          <Step3_UICustomization
            agentName={agentName}
            setAgentName={setAgentName}
            theme={chatInterfaceTheme}
            setTheme={setChatInterfaceTheme}
            primaryColor={messageBubbleColor}
            setPrimaryColor={setMessageBubbleColor}
            profileImageUrl={profileImageUrl}
            initialMessage={initialMessage}
            onNext={handleSaveUICustomization}
          />
        );
      case 4:
        return (
          <Step4_QuickTriggersSetup
            enabledTriggers={enabledQuickTriggers}
            toggleTrigger={(id) => {
              setEnabledQuickTriggers(prev =>
                prev.includes(id)
                  ? prev.filter(t => t !== id)
                  : [...prev, id]
              );
            }}
            onNext={handleSaveQuickTriggers}
            onSkip={handleSaveQuickTriggers}
          />
        );
      case 5:
        return agentId ? (
          <Step5_ShopifyConnection
            agentId={agentId}
            onNext={handleSkipShopify}
            onSkip={handleSkipShopify}
          />
        ) : null;
      case 6:
        return (
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="h-16 w-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              {isProcessing ? (
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              ) : (
                <Check className="h-8 w-8 text-green-600" />
              )}
            </div>
            <h2 className="text-3xl font-bold">Your AI assistant is ready! 🎉</h2>
            <p className="text-muted-foreground text-lg">
              Redirecting you to deployment options...
            </p>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
      {currentStep < 6 && (
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, ...(isEcommerceDetected || currentStep >= 5 ? [5] : [])].map((step) => (
              <div
                key={step}
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-full text-sm font-semibold transition-all",
                  currentStep >= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {currentStep > step ? <Check className="h-4 w-4" /> : step}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {renderStep()}
    </div>
  );
};
