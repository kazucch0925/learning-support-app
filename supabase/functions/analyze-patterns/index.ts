import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id } = await req.json();

    // 学習パターンの分析
    const { data: patterns } = await supabaseClient
      .from('learning_patterns')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!patterns?.length) {
      return new Response(
        JSON.stringify({ message: 'No learning patterns found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 最適な学習時間の分析
    const bestTimePatterns = patterns.reduce((acc, pattern) => {
      const hour = new Date('1970-01-01T' + pattern.start_time).getHours();
      if (!acc[hour]) acc[hour] = { count: 0, completion: 0 };
      acc[hour].count++;
      acc[hour].completion += pattern.completion_rate;
      return acc;
    }, {});

    // 最も効果的な時間帯を特定
    let bestHour = 0;
    let bestCompletionRate = 0;
    Object.entries(bestTimePatterns).forEach(([hour, data]) => {
      const avgCompletion = data.completion / data.count;
      if (avgCompletion > bestCompletionRate) {
        bestHour = parseInt(hour);
        bestCompletionRate = avgCompletion;
      }
    });

    // 提案の生成
    const suggestion = {
      user_id,
      title: `${bestHour}時台が最適な学習時間です`,
      description: `あなたの学習データを分析したところ、${bestHour}時台の学習が最も効果的です。この時間帯は平均${Math.round(bestCompletionRate * 100)}%の目標達成率があります。`,
      type: 'timing',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1週間後に期限切れ
      metadata: {
        best_hour: bestHour,
        completion_rate: bestCompletionRate,
        analysis_date: new Date().toISOString()
      }
    };

    // 提案の保存
    const { error: insertError } = await supabaseClient
      .from('ai_suggestions')
      .insert([suggestion]);

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ suggestion }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});