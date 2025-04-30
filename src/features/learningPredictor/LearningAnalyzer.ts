import { Goal, Session } from '../../types';

export type LearningPattern = {
  preferred_days: string[];
  preferred_time_of_day: string;
  average_duration: number;
  consistency: number; // 0-100
  streak_history: {
    longest_streak: number;
    current_streak: number;
    break_patterns: { day: string; frequency: number }[];
  };
};

export type RiskFactor = {
  type: 'streak_risk' | 'motivation_drop' | 'time_constraint';
  level: number; // 0-100
  reason: string;
  suggested_actions: string[];
};

export class LearningAnalyzer {
  /**
   * ユーザーの学習パターンを分析する
   */
  analyze_pattern(sessions: Session[], goal: Goal): LearningPattern {
    // 曜日ごとの学習頻度を計算
    const day_count: Record<string, number> = {
      Sunday: 0, Monday: 0, Tuesday: 0, 
      Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0
    };

    // 時間帯ごとの学習頻度を計算
    const time_of_day_count: Record<string, number> = {
      morning: 0, afternoon: 0, evening: 0, night: 0
    };

    // セッション時間の合計と平均を計算
    let total_duration = 0;
    // let session_count = sessions.length;

    // 最近のセッションに重み付けするための係数
    const recency_weight = 1.5;
    
    // ストリークの解析用データ収集
    let current_streak = goal.streak_days || 0;
    let longest_streak = current_streak;
    const streak_breaks: Date[] = [];
    
    // 日付ごとにセッションをグループ化
    const sessions_by_date: Record<string, Session[]> = {};
    
    sessions.forEach((session, index) => {
      const session_date = new Date(session.timestamp);
      const date_key = session_date.toISOString().split('T')[0];
      const day_name = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][session_date.getDay()];
      const hour = session_date.getHours();
      
      // 曜日のカウント
      day_count[day_name]++;
      
      // 時間帯の分類
      if (hour >= 5 && hour < 12) time_of_day_count.morning++;
      else if (hour >= 12 && hour < 17) time_of_day_count.afternoon++;
      else if (hour >= 17 && hour < 22) time_of_day_count.evening++;
      else time_of_day_count.night++;
      
      // セッション時間の追加（最近のセッションに重み付け）
      const weight = index >= sessions.length - 7 ? recency_weight : 1;
      total_duration += session.duration_minutes * weight;
      
      // 日付ごとにセッションをグループ化
      if (!sessions_by_date[date_key]) {
        sessions_by_date[date_key] = [];
      }
      sessions_by_date[date_key].push(session);
    });
    
    // 連続した学習日の検出（ストリーク計算）
    // この部分は実際のデータ構造に合わせて調整が必要
    
    // 好みの曜日を決定（上位2つ）
    const preferred_days = Object.entries(day_count)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(entry => entry[0]);
    
    // 好みの時間帯を決定
    const preferred_time_of_day = Object.entries(time_of_day_count)
      .sort((a, b) => b[1] - a[1])[0][0];
    
    // 平均セッション時間（直近のセッションに重み付け）
    const weighted_session_count = sessions.length - 7 + (7 * recency_weight);
    const average_duration = total_duration / weighted_session_count;
    
    // 一貫性スコアの計算（0-100）
    // 要素：規則性、頻度、ストリーク維持など
    let consistency = this.calculate_consistency(sessions, goal);
    
    // ストリーク中断パターンの分析
    const break_patterns = this.analyze_streak_breaks(streak_breaks);
    
    return {
      preferred_days,
      preferred_time_of_day,
      average_duration,
      consistency,
      streak_history: {
        longest_streak,
        current_streak,
        break_patterns
      }
    };
  }
  
  /**
   * 学習の一貫性スコアを計算
   */
  private calculate_consistency(sessions: Session[], goal: Goal): number {
    if (sessions.length < 3) return 50; // データ不足の場合はデフォルト値
    
    // 目標時間との比較
    const target_minutes = goal.target_minutes_per_day;
    const avg_minutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0) / sessions.length;
    const time_ratio = Math.min(avg_minutes / target_minutes, 1) * 40; // 最大40ポイント
    
    // 頻度の規則性（同じ曜日・同じ時間帯で学習しているか）
    const frequency_score = this.calculate_frequency_regularity(sessions) * 30; // 最大30ポイント
    
    // 継続性（ストリーク）
    const streak_score = Math.min(goal.streak_days / 7, 1) * 30; // 最大30ポイント
    
    // 合計スコア（最大100）
    return Math.min(time_ratio + frequency_score + streak_score, 100);
  }
  
  /**
   * 学習頻度の規則性を計算
   */
  private calculate_frequency_regularity(sessions: Session[]): number {
    // 学習時間の標準偏差を計算（小さいほど規則的）
    const timestamps = sessions.map(s => new Date(s.timestamp).getHours());
    const mean = timestamps.reduce((sum, t) => sum + t, 0) / timestamps.length;
    const variance = timestamps.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / timestamps.length;
    const std_dev = Math.sqrt(variance);
    
    // 標準偏差が小さいほど規則性が高い（最大1）
    return Math.max(0, 1 - (std_dev / 12));
  }
  
  /**
   * ストリーク中断パターンを分析
   */
  private analyze_streak_breaks(breaks: Date[]): { day: string; frequency: number }[] {
    const day_count: Record<string, number> = {};
    
    breaks.forEach(date => {
      const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
      day_count[day] = (day_count[day] || 0) + 1;
    });
    
    return Object.entries(day_count)
      .map(([day, frequency]) => ({ day, frequency }))
      .sort((a, b) => b.frequency - a.frequency);
  }
  
  /**
   * リスク要因を予測
   */
  predict_risk_factors(pattern: LearningPattern, goal: Goal): RiskFactor[] {
    const risks: RiskFactor[] = [];
    
    // ストリーク中断リスク
    if (pattern.consistency < 50) {
      risks.push({
        type: 'streak_risk',
        level: 100 - pattern.consistency,
        reason: '学習パターンの一貫性が低いため、ストリークが途切れるリスクがあります',
        suggested_actions: [
          '学習時間を固定してリマインダーを設定する',
          '毎日少しでも学習する習慣を作る',
          '週間計画を立てて学習スケジュールを可視化する'
        ]
      });
    }
    
    // モチベーション低下リスク
    if (pattern.average_duration < goal.target_minutes_per_day * 0.7 && pattern.streak_history.current_streak > 5) {
      risks.push({
        type: 'motivation_drop',
        level: 70,
        reason: '目標時間に届いていない学習セッションが続いており、モチベーション低下の兆候があります',
        suggested_actions: [
          '目標を小さく分割して達成感を得やすくする',
          '異なる学習方法を取り入れてみる',
          '学習仲間を見つけて互いに励まし合う'
        ]
      });
    }
    
    // 時間制約リスク
    const non_preferred_days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      .filter(day => !pattern.preferred_days.includes(day));
    
    if (pattern.preferred_days.length <= 2) {
      risks.push({
        type: 'time_constraint',
        level: 60,
        reason: `特定の曜日(${pattern.preferred_days.join('・')})にのみ学習する傾向があり、スケジュール変更に弱い可能性があります`,
        suggested_actions: [
          `${non_preferred_days[0]}や${non_preferred_days[1]}にも短時間の学習枠を確保する`,
          '学習セッションを複数の短い時間に分割する',
          'モバイルアプリでの学習時間を増やし、場所を選ばず学習できるようにする'
        ]
      });
    }
    
    return risks;
  }
} 