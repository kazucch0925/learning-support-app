import React from 'react';
import { Users } from 'lucide-react';
import { FriendsList } from '../components/FriendsList';
import { FriendlyLeaderboard } from '../components/FriendlyLeaderboard';

export const FriendlyCompetitionPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold flex items-center mb-5">
          <Users className="h-6 w-6 mr-2 text-blue-600" />
          友だちと一緒に学ぶ
        </h1>
        <p className="mb-4 text-gray-700">
          友だちと一緒に学習を進めることで、モチベーションを高め合いましょう。お互いの進捗を共有し、励まし合いながら目標達成を目指します。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FriendsList />
        </div>
        <div>
          <FriendlyLeaderboard />
        </div>
      </div>
    </div>
  );
}; 