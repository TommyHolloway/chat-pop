import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { Bot } from 'lucide-react';

interface LogoProps {
  to?: string;
  className?: string;
}

export const Logo = ({ to = "/", className = "flex items-center space-x-2 font-bold text-xl" }: LogoProps) => {
  const { theme } = useTheme();

  return (
    <Link to={to} className={className}>
      {theme === 'dark' ? (
        <img 
          src="/lovable-uploads/bee86699-1746-4fa0-b626-746619c93cc6.png" 
          alt="EccoChat" 
          className="h-52 w-auto"
        />
      ) : (
        <img 
          src="/lovable-uploads/9d2e7bcf-8be2-4187-b512-43e62086ae5a.png" 
          alt="Chat pop" 
          className="h-52 w-auto"
        />
      )}
    </Link>
  );
};