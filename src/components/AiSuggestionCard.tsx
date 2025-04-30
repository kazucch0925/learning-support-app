import React from 'react';
import { Lightbulb, CheckCircle, X, Clock, BookOpen, FileText, Heart, Edit } from 'lucide-react';
import type { AiSuggestion } from '../types';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';

interface AiSuggestionCardProps {
  suggestion: AiSuggestion;
  onApply: (id: string) => void;
  onDismiss: (id: string) => void;
}

const AiSuggestionCard: React.FC<AiSuggestionCardProps> = ({ 
  suggestion, 
  onApply, 
  onDismiss 
}) => {
  const typeStyles = {
    timing: {
      icon: <Clock className="h-5 w-5 text-blue-500" />,
      badge: '最適な時間帯',
      color: 'blue'
    },
    method: {
      icon: <BookOpen className="h-5 w-5 text-emerald-500" />,
      badge: '学習方法',
      color: 'emerald'
    },
    content: {
      icon: <FileText className="h-5 w-5 text-purple-500" />,
      badge: 'コンテンツ',
      color: 'purple'
    },
    motivation: {
      icon: <Heart className="h-5 w-5 text-rose-500" />,
      badge: 'モチベーション',
      color: 'rose'
    },
    goal_adjustment: {
      icon: <Lightbulb className="h-5 w-5 text-yellow-500" />,
      badge: '目標調整',
      color: 'yellow'
    },
    manual_adjustment: {
      icon: <Edit className="h-5 w-5 text-gray-500" />,
      badge: '目標変更',
      color: 'gray'
    }
  };

  const defaultStyle = {
    icon: <Lightbulb className="h-5 w-5 text-gray-500" />,
    badge: '提案',
    color: 'gray'
  };

  const style = typeStyles[suggestion.type as keyof typeof typeStyles] || defaultStyle;
  
  return (
    <Card className={`bg-gradient-to-br from-${style.color}-50 to-white border-${style.color}-100`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            {style.icon}
            <CardTitle className="text-base ml-2">{suggestion.title}</CardTitle>
          </div>
          <Badge variant="primary" size="sm" className={`bg-${style.color}-100 text-${style.color}-800`}>
            {style.badge}
          </Badge>
        </div>
        <CardDescription>{suggestion.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700">
          {suggestion.type === 'goal_adjustment' && '学習状況に合わせて目標が自動調整されました。'}
          {suggestion.type === 'manual_adjustment' && '目標が手動で変更されました。'}
          {suggestion.type === 'timing' && '学習パターンの分析に基づく提案です。'}
          {suggestion.type === 'method' && 'より効果的な学習方法を提案します。'}
          {suggestion.type === 'content' && '現在の目標に合わせたコンテンツです。'}
          {suggestion.type === 'motivation' && 'モチベーション維持のためのアドバイスです。'}
        </p>
      </CardContent>
      <CardFooter className="justify-end space-x-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onDismiss(suggestion.id)}
          icon={<X className="h-4 w-4" />}
        >
          後で
        </Button>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={() => onApply(suggestion.id)}
          icon={<CheckCircle className="h-4 w-4" />}
        >
          適用する
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AiSuggestionCard;