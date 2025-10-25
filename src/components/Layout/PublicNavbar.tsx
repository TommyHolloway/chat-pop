import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, Menu, Home } from 'lucide-react';
import { useState } from 'react';
import { Logo } from './Logo';

export const PublicNavbar = () => {
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Logo />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-foreground hover:text-foreground/80 transition-colors">
              <span className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Solution
              </span>
            </Link>
            <Link to="/features" className="text-foreground hover:text-foreground/80 transition-colors">
              Features
            </Link>
            <Link to="/pricing" className="text-foreground hover:text-foreground/80 transition-colors">
              Pricing
            </Link>
          </div>

          {/* Right side - Auth & Theme */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>

            <div className="hidden md:flex items-center space-x-2">
              <Link to="/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Button onClick={() => navigate('/auth/signup')}>Get Started</Button>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t py-4">
            <div className="flex flex-col space-y-4">
              <Link to="/" className="text-foreground hover:text-foreground/80 transition-colors flex items-center gap-2">
                <Home className="h-4 w-4" />
                Solution
              </Link>
              <Link to="/features" className="text-foreground hover:text-foreground/80 transition-colors">
                Features
              </Link>
              <Link to="/pricing" className="text-foreground hover:text-foreground/80 transition-colors">
                Pricing
              </Link>
              <div className="flex flex-col space-y-2 pt-4 border-t">
                <Link to="/auth/login">
                  <Button variant="ghost" className="w-full justify-start">Sign In</Button>
                </Link>
                <Button className="w-full" onClick={() => navigate('/auth/signup')}>Get Started</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};