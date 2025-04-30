import React, { useState, useEffect } from 'react';
import type { Database } from '../lib/database.types';

type Goal = Database['public']['Tables']['goals']['Row'];

interface LearningTreeProps {
  goals: Goal[];
  totalPoints: number;
  streakDays: number;
}

const LearningTree: React.FC<LearningTreeProps> = ({ goals, totalPoints, streakDays }) => {
  const [treeLevel, setTreeLevel] = useState(1);
  const [leafCount, setLeafCount] = useState(0);
  const [flowerCount, setFlowerCount] = useState(0);
  
  useEffect(() => {
    // ツリーレベルの計算（500ポイントごとにレベルアップ）
    const level = Math.max(1, Math.floor(totalPoints / 500) + 1);
    setTreeLevel(level);
    
    // 葉の数を計算（目標達成度に基づく）
    const totalAchievement = goals.reduce((sum, goal) => {
      const achievementRate = goal.current_minutes_per_day / goal.target_minutes_per_day;
      return sum + (achievementRate > 1 ? 1 : achievementRate);
    }, 0);
    const leaves = Math.min(50, Math.floor(totalAchievement * 10));
    setLeafCount(leaves);

    // 花の数を計算（連続達成日数に基づく）
    const flowers = Math.min(20, Math.floor(streakDays / 7));
    setFlowerCount(flowers);
  }, [goals, totalPoints, streakDays]);
  
  // 幹と枝の生成
  const renderTrunk = () => {
    return (
      <div 
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 bg-gradient-to-t from-amber-800 to-amber-700 rounded-md"
        style={{ 
          height: `${Math.min(60, 20 + treeLevel * 8)}%`,
          transition: 'height 1s ease-in-out'
        }} 
      />
    );
  };
  
  // 枝の生成
  const renderBranches = () => {
    const branches = [];
    const branchCount = Math.min(6, treeLevel + 1);
    
    for (let i = 0; i < branchCount; i++) {
      const isLeftBranch = i % 2 === 0;
      const branchHeight = 40 + (i * 10);
      const branchWidth = 30 + (i * 5);
      const branchAngle = isLeftBranch ? -30 : 30;
      
      branches.push(
        <div 
          key={`branch-${i}`}
          className="absolute w-4 bg-gradient-to-t from-amber-800 to-amber-700 rounded-full origin-bottom" 
          style={{
            height: `${branchWidth}px`,
            bottom: `${branchHeight}%`,
            left: isLeftBranch ? 'calc(50% - 15px)' : '50%',
            transform: `rotate(${branchAngle}deg)`,
            transformOrigin: isLeftBranch ? 'right bottom' : 'left bottom',
            transition: 'all 1s ease-in-out',
            opacity: i < treeLevel + 1 ? 1 : 0,
          }} 
        />
      );
    }
    
    return branches;
  };
  
  // 葉の生成
  const renderLeaves = () => {
    const leaves = [];
    
    for (let i = 0; i < leafCount; i++) {
      const randomX = Math.random() * 80 - 40; // -40 to 40
      const randomY = Math.random() * 60 + 20; // 20 to 80
      const size = Math.random() * 10 + 15; // 15 to 25
      const rotation = Math.random() * 360;
      const hue = 120 + Math.random() * 30; // 緑の色相
      
      leaves.push(
        <div 
          key={`leaf-${i}`}
          className="absolute rounded-full animate-leaf-wiggle"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: `calc(50% + ${randomX}px)`,
            bottom: `${randomY}%`,
            backgroundColor: `hsl(${hue}, 70%, 45%)`,
            transform: `rotate(${rotation}deg)`,
            opacity: 0.85,
            transition: 'all 0.5s ease-in-out',
          }}
        />
      );
    }
    
    return leaves;
  };

  // 花の生成
  const renderFlowers = () => {
    const flowers = [];
    
    for (let i = 0; i < flowerCount; i++) {
      const randomX = Math.random() * 100 - 50; // -50 to 50
      const randomY = Math.random() * 70 + 10; // 10 to 80
      const size = Math.random() * 8 + 12; // 12 to 20
      const rotation = Math.random() * 360;
      const hue = Math.random() * 60 + 300; // ピンクや紫の色相
      
      flowers.push(
        <div 
          key={`flower-${i}`}
          className="absolute animate-flower-wiggle"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: `calc(50% + ${randomX}px)`,
            bottom: `${randomY}%`,
            transform: `rotate(${rotation}deg)`,
          }}
        >
          {/* 花びら */}
          {[0, 72, 144, 216, 288].map((angle, index) => (
            <div
              key={index}
              className="absolute w-3 h-3 rounded-full"
              style={{
                backgroundColor: `hsl(${hue}, 70%, 75%)`,
                transform: `rotate(${angle}deg) translate(${size/4}px, 0)`,
                transformOrigin: 'center center',
              }}
            />
          ))}
          {/* 花の中心 */}
          <div
            className="absolute rounded-full"
            style={{
              width: `${size/3}px`,
              height: `${size/3}px`,
              left: `${size/3}px`,
              top: `${size/3}px`,
              backgroundColor: `hsl(${hue}, 70%, 65%)`,
            }}
          />
        </div>
      );
    }
    
    return flowers;
  };
  
  return (
    <div className="relative w-full h-80 mb-6">
      <style>
        {`
          @keyframes leafWiggle {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(5deg); }
          }
          @keyframes flowerWiggle {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(3deg); }
          }
          .animate-leaf-wiggle {
            animation: leafWiggle 3s ease-in-out infinite;
          }
          .animate-flower-wiggle {
            animation: flowerWiggle 4s ease-in-out infinite;
          }
        `}
      </style>
      
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 rounded-lg" />
      {renderTrunk()}
      {renderBranches()}
      {renderLeaves()}
      {renderFlowers()}
      
      <div className="absolute top-4 left-4 bg-white/90 p-3 rounded-lg shadow-sm">
        <div className="text-sm font-medium text-emerald-800">Level {treeLevel}</div>
        <div className="text-xs text-gray-600">
          次のレベルまで: {500 - (totalPoints % 500)}ポイント
        </div>
        <div className="text-xs text-gray-600">
          連続達成: {streakDays}日
        </div>
      </div>
    </div>
  );
};

export default LearningTree;