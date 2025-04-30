import { Goal } from '../../types';
import { LearningAnalyzer, LearningPattern, RiskFactor } from './LearningAnalyzer';
import { v4 as uuidv4 } from 'uuid';

export type PredictionInsight = {
  id: string;
  userId: string;
  goalId: string;
  predictionType: 'streak_risk' | 'motivation_drop' | 'time_constraint';
  riskLevel: number; // 0-100
  predictedAt: Date;
  isAddressed: boolean;
  suggestedActions: string[];
  metadata: Record<string, any>;
};

export type SupportContent = {
  id: string;
  predictionId: string;
  contentType: 'tip' | 'resource' | 'motivation' | 'adjustment';
  content: string;
  isViewed: boolean;
  createdAt: Date;
  expiresAt: Date;
};

export class PredictionEngine {
  private learningAnalyzer: LearningAnalyzer;

  constructor() {
    this.learningAnalyzer = new LearningAnalyzer();
  }
  
  /**
   * ユーザーの学習データから予測インサイトを生成
   */
  generateInsights(userId: string, goal: Goal, sessions: any[]): PredictionInsight[] {
    const insights: PredictionInsight[] = [];
    
    // 学習パターンの分析
    const pattern = this.learningAnalyzer.analyze_pattern(sessions, goal);
    
    // リスク要因の予測
    const riskFactors = this.learningAnalyzer.predict_risk_factors(pattern, goal);
    
    // リスク要因から予測インサイトを生成
    insights.push(...this.convertRisksToInsights(userId, goal.id, riskFactors, pattern));
    
    // ストリーク中断リスクの予測
    if (riskFactors.some(r => r.type === 'streak_risk' && r.level > 50)) {
      insights.push({
        id: uuidv4(), // カスタムIDの代わりにUUID形式のIDを生成
        userId,
        goalId: goal.id,
        predictionType: 'streak_risk',
        riskLevel: riskFactors.find(r => r.type === 'streak_risk')?.level || 0,
        predictedAt: new Date(),
        isAddressed: false,
        suggestedActions: [],
        metadata: {
          patternSummary: {
            preferredDays: pattern.preferred_days,
            preferredTimeOfDay: pattern.preferred_time_of_day,
            consistencyScore: pattern.consistency
          }
        }
      });
    }
    
    // モチベーション低下の予測
    if (riskFactors.some(r => r.type === 'motivation_drop' && r.level > 40)) {
      insights.push({
        id: uuidv4(), // カスタムIDの代わりにUUID形式のIDを生成
        userId,
        goalId: goal.id,
        predictionType: 'motivation_drop',
        riskLevel: riskFactors.find(r => r.type === 'motivation_drop')?.level || 0,
        predictedAt: new Date(),
        isAddressed: false,
        suggestedActions: [],
        metadata: {
          patternSummary: {
            preferredDays: pattern.preferred_days,
            preferredTimeOfDay: pattern.preferred_time_of_day,
            consistencyScore: pattern.consistency
          },
          averageDuration: pattern.average_duration,
          targetDuration: pattern.average_duration
        }
      });
    }
    
    // 時間制約の課題を予測
    if (riskFactors.some(r => r.type === 'time_constraint' && r.level > 60)) {
      insights.push({
        id: uuidv4(), // カスタムIDの代わりにUUID形式のIDを生成
        userId,
        goalId: goal.id,
        predictionType: 'time_constraint',
        riskLevel: riskFactors.find(r => r.type === 'time_constraint')?.level || 0,
        predictedAt: new Date(),
        isAddressed: false,
        suggestedActions: [],
        metadata: {
          patternSummary: {
            preferredDays: pattern.preferred_days,
            preferredTimeOfDay: pattern.preferred_time_of_day,
            consistencyScore: pattern.consistency
          }
        }
      });
    }
    
    return insights;
  }
  
  /**
   * リスク要因を予測インサイトに変換
   */
  private convertRisksToInsights(
    userId: string, 
    goalId: string, 
    risks: RiskFactor[], 
    pattern: LearningPattern
  ): PredictionInsight[] {
    const now = new Date();
    
    return risks.map(risk => {
      // ユニークなID生成（実際の実装ではUUID等を使用）
      const id = uuidv4(); // UUID形式のIDを生成
      
      // リスクタイプに応じたメタデータを生成
      const metadata: Record<string, any> = {
        patternSummary: {
          preferredDays: pattern.preferred_days,
          preferredTimeOfDay: pattern.preferred_time_of_day,
          consistencyScore: pattern.consistency
        }
      };
      
      // リスクタイプに応じた追加情報
      if (risk.type === 'streak_risk') {
        metadata.streakHistory = pattern.streak_history;
      } else if (risk.type === 'motivation_drop') {
        metadata.averageDuration = pattern.average_duration;
        metadata.targetDuration = pattern.average_duration;  // 目標時間
      }
      
      return {
        id,
        userId,
        goalId,
        predictionType: risk.type,
        riskLevel: risk.level,
        predictedAt: now,
        isAddressed: false,
        suggestedActions: risk.suggested_actions,
        metadata
      };
    });
  }
  
  /**
   * 予測に基づいてサポートコンテンツを生成
   */
  generateSupportContent(prediction: PredictionInsight): SupportContent[] {
    const contents: SupportContent[] = [];
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setDate(expiryDate.getDate() + 7); // 1週間後に期限切れ
    
    // 予測タイプに応じたコンテンツを生成
    switch (prediction.predictionType) {
      case 'streak_risk':
        contents.push(this.createStreakRiskContent(prediction, now, expiryDate));
        break;
        
      case 'motivation_drop':
        contents.push(this.createMotivationContent(prediction, now, expiryDate));
        break;
        
      case 'time_constraint':
        contents.push(this.createTimeConstraintContent(prediction, now, expiryDate));
        break;
    }
    
    // 共通のモチベーションコンテンツを追加
    contents.push({
      id: uuidv4(), // サポートコンテンツのIDもUUID形式に変更
      predictionId: prediction.id,
      contentType: 'motivation',
      content: this.getMotivationalMessage(prediction.riskLevel),
      isViewed: false,
      createdAt: now,
      expiresAt: expiryDate
    });
    
    return contents;
  }
  
  /**
   * ストリークリスクに対するサポートコンテンツを作成
   */
  private createStreakRiskContent(
    prediction: PredictionInsight,
    createdAt: Date,
    expiresAt: Date
  ): SupportContent {
    // ストリーク維持のためのヒント
    const streakTips = [
      '毎日少しでも取り組むことでストリークを維持できます。5分でも学習時間を確保しましょう。',
      '学習の習慣を日常のルーティンに組み込みましょう。例えば、朝のコーヒーを飲む前に5分間復習する等。',
      'ストリークを視覚化することで継続モチベーションが上がります。カレンダーやアプリで記録を確認しましょう。'
    ];
    
    return {
      id: uuidv4(), // サポートコンテンツのIDもUUID形式に変更
      predictionId: prediction.id,
      contentType: 'tip',
      content: streakTips[Math.floor(Math.random() * streakTips.length)],
      isViewed: false,
      createdAt,
      expiresAt
    };
  }
  
  /**
   * モチベーション低下リスクに対するサポートコンテンツを作成
   */
  private createMotivationContent(
    prediction: PredictionInsight,
    createdAt: Date,
    expiresAt: Date
  ): SupportContent {
    // モチベーション維持のためのリソース
    const resources = [
      {
        title: '学習モチベーションを維持する5つの方法',
        link: '/resources/motivation-tips',
        description: '長期的な学習におけるモチベーション維持戦略を紹介します。'
      },
      {
        title: '目標設定の最適化ガイド',
        link: '/resources/goal-setting',
        description: '達成可能な小目標を設定して、モチベーションを維持する方法を学びましょう。'
      },
      {
        title: '学習の楽しさを再発見するアプローチ',
        link: '/resources/fun-learning',
        description: '学ぶ喜びを思い出し、内発的モチベーションを高める方法を紹介します。'
      }
    ];
    
    const selectedResource = resources[Math.floor(Math.random() * resources.length)];
    
    return {
      id: uuidv4(), // サポートコンテンツのIDもUUID形式に変更
      predictionId: prediction.id,
      contentType: 'resource',
      content: JSON.stringify(selectedResource),
      isViewed: false,
      createdAt,
      expiresAt
    };
  }
  
  /**
   * 時間制約リスクに対するサポートコンテンツを作成
   */
  private createTimeConstraintContent(
    prediction: PredictionInsight,
    createdAt: Date,
    expiresAt: Date
  ): SupportContent {
    // 時間管理の調整提案
    const adjustments = [
      '学習セッションを短く分割して、隙間時間を活用しましょう。5-10分の短時間学習でも効果があります。',
      '移動時間や待ち時間にモバイルアプリで学習できるよう、環境を整えておきましょう。',
      '週末にまとめて学習するのではなく、平日も少しずつ取り組むことで、より効果的に習慣化できます。'
    ];
    
    return {
      id: uuidv4(), // サポートコンテンツのIDもUUID形式に変更
      predictionId: prediction.id,
      contentType: 'adjustment',
      content: adjustments[Math.floor(Math.random() * adjustments.length)],
      isViewed: false,
      createdAt,
      expiresAt
    };
  }
  
  /**
   * リスクレベルに応じたモチベーションメッセージを取得
   */
  private getMotivationalMessage(riskLevel: number): string {
    if (riskLevel >= 80) {
      return '挑戦は困難かもしれませんが、一歩一歩進むことで必ず成長できます。今日は小さな一歩から始めましょう。';
    } else if (riskLevel >= 50) {
      return 'あなたの努力は確実に成果につながっています。今の調子を維持しながら、少しずつ改善を重ねていきましょう。';
    } else {
      return '素晴らしい進捗です！あなたの学習習慣は効果的に機能しています。この調子で続けましょう。';
    }
  }
} 