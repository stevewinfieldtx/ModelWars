import React, { useState, useEffect } from 'react';
import { supabase, BUCKET_NAME, NSFW_BUCKET_NAME } from '../supabaseClient';

interface StatsScreenProps {
  onBack: () => void;
  onShowModelProfile: (modelName: string) => void;
}

interface ChampionStat {
  name: string;
  picks: number;
  winRate: string;
  imageUrl: string | null;
}

interface StatsData {
  totalGames: number;
  topChampions: ChampionStat[];
}

const getCharacterImage = async (characterName: string): Promise<string | null> => {
    // Try SFW bucket first, then NSFW if it fails
    const buckets = [BUCKET_NAME, NSFW_BUCKET_NAME];
    for (const bucket of buckets) {
      const { data, error } = await supabase.storage.from(bucket).list(characterName, { limit: 1 });
      if (!error && data && data.length > 0 && data[0].id) {
        const file = data[0];
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(`${characterName}/${file.name}`);
        return urlData.publicUrl;
      }
    }
    return null; // Return null if no image is found in any bucket
};

const StatsScreen: React.FC<StatsScreenProps> = ({ onBack, onShowModelProfile }) => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not found. Please log in again.");

        // Fetch all of the user's choices (they are always the winner from their perspective)
        const { data: userChoices, error: choicesError } = await supabase
          .from('battles')
          .select('winner_name')
          .eq('user_id', user.id);

        if (choicesError) throw choicesError;

        const totalGames = userChoices.length;

        if (totalGames === 0) {
            setStats({ totalGames: 0, topChampions: [] });
            setIsLoading(false);
            return;
        }

        const pickCounts = userChoices.reduce((acc, choice) => {
          acc[choice.winner_name] = (acc[choice.winner_name] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const sortedPicks = Object.entries(pickCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
        
        // Fetch global win rates and images for the top champions
        const topChampions: ChampionStat[] = await Promise.all(
            sortedPicks.map(async ([name, picks]) => {
                const { count: wins } = await supabase.from('battles').select('*', { count: 'exact', head: true }).eq('winner_name', name);
                const { count: losses } = await supabase.from('battles').select('*', { count: 'exact', head: true }).eq('loser_name', name);
                
                const totalGlobalGames = (wins ?? 0) + (losses ?? 0);
                const winRate = totalGlobalGames > 0 ? `${((wins ?? 0) / totalGlobalGames * 100).toFixed(0)}%` : 'N/A';
                
                const imageUrl = await getCharacterImage(name);

                return { name, picks, winRate, imageUrl };
            })
        );
        
        setStats({ totalGames, topChampions });

      } catch (err: any) {
        setError(err.message || "Failed to fetch stats. Have you run the required SQL commands to update the 'battles' table?");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="flex flex-col w-full h-full p-4 sm:p-8 bg-gray-900 text-white animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">Your Battle Stats</h1>
        <button
          onClick={onBack}
          className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-transform duration-200 transform hover:scale-105"
        >
          Back
        </button>
      </div>

      {isLoading ? (
        <div className="flex-grow flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="flex-grow flex items-center justify-center p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-center">
            <p className="text-red-300">{error}</p>
        </div>
      ) : stats && (
        <div className="flex-grow overflow-y-auto">
            <div className="bg-gray-800/50 p-6 rounded-2xl mb-6 text-center">
                <p className="text-lg text-gray-400">Total Battles</p>
                <p className="text-6xl font-bold text-white">{stats.totalGames}</p>
            </div>

            <h2 className="text-2xl font-semibold mb-4 text-gray-300">Your Top Champions</h2>
            {stats.topChampions.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats.topChampions.map((champ, index) => (
                        <button key={champ.name} onClick={() => onShowModelProfile(champ.name)} className="bg-gray-800 p-4 rounded-xl flex items-center gap-4 animate-fade-in text-left w-full hover:bg-gray-700/80 transition-colors duration-200" style={{ animationDelay: `${index * 100}ms`}}>
                            <img src={champ.imageUrl || 'https://placehold.co/100x100/1f2937/7ca3f5?text=?'} alt={champ.name} className="w-24 h-24 rounded-lg object-cover bg-gray-700" />
                            <div className="flex-grow">
                                <h3 className="text-xl font-bold truncate text-white">{champ.name}</h3>
                                <p className="text-sm text-gray-400">{champ.picks} {champ.picks === 1 ? 'pick' : 'picks'}</p>
                                <div className="mt-2 bg-gray-700/50 p-2 rounded-md text-center">
                                    <p className="text-lg font-semibold text-teal-400">{champ.winRate}</p>
                                    <p className="text-xs text-gray-400">Global Win Rate</p>
                                </div>
                            </div>
                        </button>
                    ))}
                 </div>
            ) : (
                <div className="text-center py-12 bg-gray-800/50 rounded-xl">
                    <p className="text-gray-400">Play some games to see your stats here!</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default StatsScreen;