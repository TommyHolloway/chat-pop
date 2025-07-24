-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create agents table
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create knowledge_files table
CREATE TABLE public.knowledge_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  processed_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create usage_tracking table
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  conversations_count INTEGER DEFAULT 0,
  storage_used_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create RLS policies for agents
CREATE POLICY "Users can view their own agents" ON public.agents
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own agents" ON public.agents
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own agents" ON public.agents
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own agents" ON public.agents
  FOR DELETE USING (user_id = auth.uid());

-- Create RLS policies for knowledge_files
CREATE POLICY "Users can view files for their agents" ON public.knowledge_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.agents 
      WHERE agents.id = knowledge_files.agent_id 
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create files for their agents" ON public.knowledge_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agents 
      WHERE agents.id = knowledge_files.agent_id 
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete files for their agents" ON public.knowledge_files
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.agents 
      WHERE agents.id = knowledge_files.agent_id 
      AND agents.user_id = auth.uid()
    )
  );

-- Create RLS policies for conversations
CREATE POLICY "Users can view conversations for their agents" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.agents 
      WHERE agents.id = conversations.agent_id 
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (true);

-- Create RLS policies for messages
CREATE POLICY "Users can view messages for their agent conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.agents a ON a.id = c.agent_id
      WHERE c.id = messages.conversation_id 
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create messages" ON public.messages
  FOR INSERT WITH CHECK (true);

-- Create RLS policies for usage_tracking
CREATE POLICY "Users can view their own usage" ON public.usage_tracking
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own usage" ON public.usage_tracking
  FOR ALL USING (user_id = auth.uid());

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('agent-files', 'agent-files', false);

-- Create storage policies for agent-files bucket
CREATE POLICY "Users can upload files for their agents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'agent-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view files for their agents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'agent-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete files for their agents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'agent-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();