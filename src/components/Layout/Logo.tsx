import { Link } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo = ({ className = '', size = 'md' }: LogoProps) => {
  const { theme } = useTheme();
  
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10'
  };

  return (
    <Link to="/" className={`flex items-center space-x-2 font-bold text-xl ${className}`}>
      {theme === 'dark' ? (
        // For now using placeholder - you can replace with your logo URL
        <div className="flex items-center space-x-2">
          <div className={`${sizeClasses[size]} w-auto bg-primary rounded flex items-center justify-center`}>
            <span className="text-primary-foreground font-bold text-sm">LOGO</span>
          </div>
        </div>
      ) : (
        <>
          <Bot className="h-6 w-6 text-primary" />
          <span className="text-gradient-primary">EccoChat</span>
        </>
      )}
    </Link>
  );
};