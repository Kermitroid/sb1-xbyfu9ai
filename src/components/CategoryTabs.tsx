import React from 'react';
import { 
  Music, 
  Gamepad2, 
  Trophy, 
  BookOpen, 
  Zap, 
  Tv, 
  Newspaper,
  Grid3X3
} from 'lucide-react';

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  className?: string;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ 
  activeCategory, 
  onCategoryChange, 
  className = '' 
}) => {
  const categories = [
    { 
      id: '', 
      name: 'All', 
      icon: Grid3X3,
      description: 'All videos'
    },
    { 
      id: 'Gaming', 
      name: 'Gaming', 
      icon: Gamepad2,
      description: 'Gaming content'
    },
    { 
      id: 'Music', 
      name: 'Music', 
      icon: Music,
      description: 'Music videos'
    },
    { 
      id: 'Technology', 
      name: 'Tech', 
      icon: Zap,
      description: 'Technology content'
    },
    { 
      id: 'Education', 
      name: 'Education', 
      icon: BookOpen,
      description: 'Educational videos'
    },
    { 
      id: 'Sports', 
      name: 'Sports', 
      icon: Trophy,
      description: 'Sports content'
    },
    { 
      id: 'Entertainment', 
      name: 'Entertainment', 
      icon: Tv,
      description: 'Entertainment videos'
    },
    { 
      id: 'News', 
      name: 'News', 
      icon: Newspaper,
      description: 'News content'
    }
  ];

  return (
    <div className={`flex items-center space-x-2 overflow-x-auto pb-2 ${className}`}>
      {categories.map((category) => {
        const Icon = category.icon;
        const isActive = activeCategory === category.id;
        
        return (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium 
              whitespace-nowrap transition-all duration-200 hover:scale-105
              ${isActive 
                ? 'bg-primary-500 text-white shadow-lg' 
                : 'bg-dark-200 text-gray-300 hover:bg-dark-100 hover:text-white'
              }
            `}
            title={category.description}
          >
            <Icon className="h-4 w-4" />
            <span>{category.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryTabs;
