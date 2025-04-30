import React from 'react';
import { 
  Award, Book, Zap, Target, Flame, Calendar, Clock, Users, Brain, 
  Sparkles, Heart, Star, Trophy
} from 'lucide-react';
import { Badge as BadgeType } from '../types';
import Card, { CardHeader, CardTitle, CardContent } from './ui/Card';

interface BadgeDisplayProps {
  badges: BadgeType[];
}

const iconMap: Record<string, React.ReactNode> = {
  'award': <Award />,
  'book': <Book />,
  'zap': <Zap />,
  'target': <Target />,
  'flame': <Flame />,
  'calendar': <Calendar />,
  'clock': <Clock />,
  'users': <Users />,
  'brain': <Brain />,
  'sparkles': <Sparkles />,
  'heart': <Heart />,
  'star': <Star />,
  'trophy': <Trophy />,
};

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ badges }) => {
  const unlockedBadges = badges.filter(badge => badge.unlockedAt);
  const lockedBadges = badges.filter(badge => !badge.unlockedAt);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Award className="h-5 w-5 mr-2 text-teal-600" />
          Your Badges
        </CardTitle>
      </CardHeader>
      <CardContent>
        {unlockedBadges.length === 0 && (
          <p className="text-sm text-gray-500 mb-4">
            Complete your learning goals to earn badges!
          </p>
        )}
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {unlockedBadges.map(badge => (
            <div key={badge.id} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 mb-2">
                {iconMap[badge.icon] || <Award />}
              </div>
              <span className="text-sm font-medium">{badge.name}</span>
              <span className="text-xs text-gray-500">{badge.description}</span>
            </div>
          ))}
          
          {lockedBadges.slice(0, 4).map(badge => (
            <div key={badge.id} className="flex flex-col items-center text-center opacity-50">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 mb-2">
                {iconMap[badge.icon] || <Award />}
              </div>
              <span className="text-sm font-medium">{badge.name}</span>
              <span className="text-xs text-gray-500">Locked</span>
            </div>
          ))}
        </div>
        
        {lockedBadges.length > 4 && (
          <p className="text-xs text-center text-gray-500 mt-4">
            + {lockedBadges.length - 4} more badges to unlock
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default BadgeDisplay;