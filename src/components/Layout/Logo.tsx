import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';

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
          src="/lovable-uploads/chatpop-logo-dark.png" 
          alt="ChatPop" 
          className="h-8 w-auto"
        />
      ) : (
        <img 
          src="/lovable-uploads/chatpop-logo-light.png" 
          alt="ChatPop" 
          className="h-8 w-auto"
        />
      )}
    </Link>
  );
};