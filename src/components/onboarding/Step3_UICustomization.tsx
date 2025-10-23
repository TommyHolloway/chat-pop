import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Sun, Moon, Upload, ArrowRight, RotateCcw } from 'lucide-react';

interface Step3Props {
  agentName: string;
  setAgentName: (name: string) => void;
  theme: 'light' | 'dark' | 'auto';
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  profileImageUrl: string | null;
  initialMessage: string;
  onNext: () => void;
}

const ChatPreview = ({ agentName, profileImageUrl, theme, primaryColor, initialMessage }: {
  agentName: string;
  profileImageUrl: string | null;
  theme: string;
  primaryColor: string;
  initialMessage: string;
}) => (
  <Card className="w-full max-w-sm">
    <CardHeader className="bg-black text-white flex flex-row items-center justify-between p-4">
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6">
          <AvatarImage src={profileImageUrl || ""} />
          <AvatarFallback>{agentName[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="font-semibold">{agentName}</span>
      </div>
      <RotateCcw className="h-4 w-4" />
    </CardHeader>
    <CardContent className={`p-4 space-y-4 min-h-[300px] ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="flex items-start gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={profileImageUrl || ""} />
          <AvatarFallback>{agentName[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className={`rounded-lg p-3 max-w-[80%] ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'}`}>
          <p className="text-sm">{initialMessage}</p>
        </div>
      </div>
      
      <div className="flex justify-end">
        <div
          className="rounded-lg p-3 max-w-[80%]"
          style={{
            backgroundColor: primaryColor,
            color: "white",
          }}
        >
          <p className="text-sm">I like AI Agents</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const Step3_UICustomization = ({
  agentName,
  setAgentName,
  theme,
  setTheme,
  primaryColor,
  setPrimaryColor,
  profileImageUrl,
  initialMessage,
  onNext
}: Step3Props) => (
  <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
    {/* Left: Form */}
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Customize your agent's look</h2>
        <p className="text-muted-foreground text-lg mt-2">
          We've pre-filled everything based on your site. Adjust as needed.
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label>Agent name</Label>
          <Input
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            className="mt-2"
          />
        </div>
        
        <div>
          <Label>Appearance</Label>
          <div className="flex gap-2 mt-2">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("light")}
            >
              <Sun className="h-4 w-4 mr-2" />
              Light
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("dark")}
            >
              <Moon className="h-4 w-4 mr-2" />
              Dark
            </Button>
            <Button
              variant={theme === "auto" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("auto")}
            >
              Auto
            </Button>
          </div>
        </div>
        
        <div>
          <Label>Primary color</Label>
          <div className="flex items-center gap-2 mt-2">
            <div
              className="w-12 h-12 rounded border-2 cursor-pointer"
              style={{ backgroundColor: primaryColor }}
              onClick={() => document.getElementById('color-input')?.click()}
            />
            <Input
              id="color-input"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-0 h-0 invisible"
            />
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
        
        <div>
          <Label>Profile picture</Label>
          <div className="flex items-center gap-3 mt-2 p-3 border rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profileImageUrl || ""} />
              <AvatarFallback>{agentName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground flex-1 truncate">
              {profileImageUrl || "No logo detected"}
            </span>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Button onClick={onNext} size="lg" className="w-full">
          Looks good, continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
    
    {/* Right: Live Chat Preview */}
    <div className="flex items-center justify-center">
      <ChatPreview
        agentName={agentName}
        profileImageUrl={profileImageUrl}
        theme={theme}
        primaryColor={primaryColor}
        initialMessage={initialMessage}
      />
    </div>
  </div>
);
