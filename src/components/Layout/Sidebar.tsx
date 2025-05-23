import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  TrendingUp, 
  Clock, 
  ThumbsUp, 
  Upload, 
  Search,
  Globe,
  Music,
  Gamepad2,
  Trophy,
  BookOpen,
  Zap
} from 'lucide-react';
import useUserStore from '../../stores/userStore';

const Sidebar = () => {
  const location = useLocation();
  const { isAuthenticated } = useUserStore();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: TrendingUp, label: 'Trending', path: '/trending' },
    { icon: Clock, label: 'Recent', path: '/recent' },
    { icon: ThumbsUp, label: 'Liked Videos', path: '/liked', requireAuth: true },
  ];

  const categoryItems = [
    { icon: Music, label: 'Music', path: '/category/music' },
    { icon: Gamepad2, label: 'Gaming', path: '/category/gaming' },
    { icon: Trophy, label: 'Sports', path: '/category/sports' },
    { icon: BookOpen, label: 'Education', path: '/category/education' },
    { icon: Zap, label: 'Technology', path: '/category/technology' },
  ];

  const toolItems = [
    { icon: Search, label: 'Search', path: '/search' },
    { icon: Globe, label: 'Aggregate', path: '/aggregate' },
    { icon: Upload, label: 'Upload', path: '/upload', requireAuth: true },
  ];

  const NavSection = ({ title, items }: { title: string; items: any[] }) => (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
        {title}
      </h3>
      <nav className="space-y-1">
        {items.map((item) => {
          if (item.requireAuth && !isAuthenticated) return null;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-dark-100'
              }`}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16">
      <div className="flex flex-col flex-grow bg-dark-200 overflow-y-auto border-r border-dark-100">
        <div className="flex-grow px-4 py-6">
          <NavSection title="Main" items={navItems} />
          <NavSection title="Categories" items={categoryItems} />
          <NavSection title="Tools" items={toolItems} />
        </div>
        
        {/* Footer Info */}
        <div className="p-4 border-t border-dark-100">
          <div className="text-xs text-gray-400">
            <p className="mb-2">© 2024 VideoTube</p>
            <p>Secure • Fast • Reliable</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
