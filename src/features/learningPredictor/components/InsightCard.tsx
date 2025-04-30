import React, { useState } from 'react';
import { PredictionInsight, SupportContent } from '../PredictionEngine';
import { 
  Zap, 
  Clock, 
  Flame, 
  ChevronDown, 
  ChevronUp,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

type InsightCardProps = {
  insight: PredictionInsight;
  supportContents: SupportContent[];
  onMarkAddressed: (insightId: string) => void;
  onViewContent: (contentId: string) => void;
};

// ResourceContent コンポーネントを定義
const ResourceContent = ({ content }: { content: string }) => {
  try {
    const resource = JSON.parse(content);
    return (
      <div>
        <p className="font-medium">{resource.title}</p>
        <p className="text-sm mt-1">{resource.description}</p>
        <a 
          href={resource.link} 
          className="mt-2 text-xs inline-flex items-center text-blue-600 hover:text-blue-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          詳細を見る <ExternalLink className="h-3 w-3 ml-1" />
        </a>
      </div>
    );
  } catch (e) {
    return <p className="text-sm">{content}</p>;
  }
};

export const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  supportContents,
  onMarkAddressed,
  onViewContent
}) => {
  const [expanded, setExpanded] = useState(false);

  // リスクレベルに基づく色を取得
  const getRiskLevelColor = (level: number) => {
    if (level >= 75) return 'bg-red-100 text-red-800 border-red-300';
    if (level >= 50) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

  // リスクタイプに基づくアイコンを取得
  const getRiskTypeIcon = (type: string) => {
    switch (type) {
      case 'streak_risk':
        return <Flame className="h-5 w-5 text-red-500" />;
      case 'motivation_drop':
        return <Zap className="h-5 w-5 text-amber-500" />;
      case 'time_constraint':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  // リスクタイプに基づくタイトルを取得
  const getRiskTypeTitle = (type: string) => {
    switch (type) {
      case 'streak_risk':
        return 'ストリーク中断のリスク';
      case 'motivation_drop':
        return 'モチベーション低下の兆候';
      case 'time_constraint':
        return '時間制約の課題';
      default:
        return 'インサイト';
    }
  };

  // 予測日時のフォーマット
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date instanceof Date ? date : new Date(date));
  };

  // インサイトが対応済みかどうか
  const isAddressed = insight.isAddressed;

  return (
    <div className={`mb-4 rounded-lg border p-4 ${isAddressed ? 'bg-gray-100 border-gray-300' : getRiskLevelColor(insight.riskLevel)}`}>
      {/* ヘッダー部分 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getRiskTypeIcon(insight.predictionType)}
          <h3 className="text-lg font-medium">{getRiskTypeTitle(insight.predictionType)}</h3>
          {isAddressed && (
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">対応済み</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm">{formatDate(insight.predictedAt)}</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-full hover:bg-gray-200"
          >
            {expanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* リスクレベルインジケーター */}
      <div className="mt-2 mb-3">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${
              insight.riskLevel >= 75
                ? 'bg-red-500'
                : insight.riskLevel >= 50
                ? 'bg-amber-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${insight.riskLevel}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span>低リスク</span>
          <span>高リスク</span>
        </div>
      </div>

      {/* 問題の理由 */}
      <p className="text-sm mt-2 mb-3">{insight.metadata.reason || '学習パターンに基づく予測結果です'}</p>

      {/* 展開時の詳細コンテンツ */}
      {expanded && (
        <div className="mt-4">
          <h4 className="text-md font-medium mb-2">推奨アクション</h4>
          <ul className="list-disc pl-5 mb-4 text-sm">
            {insight.suggestedActions.map((action, index) => (
              <li key={index} className="mb-1">{action}</li>
            ))}
          </ul>

          <h4 className="text-md font-medium mb-2">サポートコンテンツ</h4>
          <div className="space-y-3">
            {supportContents.map(content => (
              <div
                key={content.id}
                className={`p-3 rounded-md border ${
                  content.isViewed ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium text-sm">
                      {content.contentType === 'tip' && 'アドバイス'}
                      {content.contentType === 'resource' && 'おすすめリソース'}
                      {content.contentType === 'motivation' && 'モチベーション'}
                      {content.contentType === 'adjustment' && '時間管理の提案'}
                    </h5>
                    {content.contentType === 'resource' ? (
                      <ResourceContent content={content.content} />
                    ) : (
                      <p className="text-sm mt-1">{content.content}</p>
                    )}
                  </div>
                  {!content.isViewed && (
                    <button
                      onClick={() => onViewContent(content.id)}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                    >
                      既読にする
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {!isAddressed && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => onMarkAddressed(insight.id)}
                className="flex items-center text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded hover:bg-green-200"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                対応済みにする
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 