import React from 'react';
import { Sparkles } from 'lucide-react';
import { useAiAssistant } from '../hooks/useAiAssistant';
import Card, { CardHeader, CardTitle } from './ui/Card';
import AiSuggestionCard from './AiSuggestionCard';

export default function AiAssistantSection() {
  const { 
    suggestions, 
    loading, 
    applySuggestion, 
    dismissSuggestion 
  } = useAiAssistant();

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  const aiSuggestionTypes = ['timing', 'method', 'content', 'motivation'];
  const filteredSuggestions = suggestions.filter(s => aiSuggestionTypes.includes(s.type));

  if (!filteredSuggestions.length) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100">
        <CardHeader>
          <div className="flex items-center justify-center text-center py-6">
            <div>
              <Sparkles className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <CardTitle className="text-purple-900">
                AIアシスタントが学習パターンを分析中
              </CardTitle>
              <p className="text-sm text-purple-600 mt-1">
                より効果的な学習方法を提案します
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filteredSuggestions.map(suggestion => (
        <AiSuggestionCard
          key={suggestion.id}
          suggestion={suggestion}
          onApply={() => applySuggestion(suggestion.id)}
          onDismiss={() => dismissSuggestion(suggestion.id)}
        />
      ))}
    </div>
  );
}