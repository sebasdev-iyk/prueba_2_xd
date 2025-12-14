import { useEffect, useState } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { Trophy, Medal, Crown } from 'lucide-react';

export default function RankingTab() {
    const [leaders, setLeaders] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'global' | 'clans'>('global');

    const CLAN_DATA = [
        { id: 'puno', name: 'Puno', xp: 15420, members: 124 },
        { id: 'lapaz', name: 'La Paz', xp: 14850, members: 118 },
        { id: 'francia', name: 'Francia', xp: 12300, members: 45 },
        { id: 'bruselas', name: 'Bruselas', xp: 9800, members: 32 },
        { id: 'losangeles', name: 'Los Angeles', xp: 8500, members: 28 },
    ];

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('xp', { ascending: false })
                .limit(10);

            if (error) throw error;
            setLeaders(data || []);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0:
                return <Crown className="w-6 h-6 text-yellow-500" />;
            case 1:
                return <Medal className="w-6 h-6 text-gray-400" />;
            case 2:
                return <Medal className="w-6 h-6 text-amber-600" />;
            default:
                return <span className="font-bold text-gray-500 w-6 text-center">{index + 1}</span>;
        }
    };

    const getRowStyle = (index: number) => {
        switch (index) {
            case 0:
                return 'bg-yellow-50 border-yellow-200';
            case 1:
                return 'bg-gray-50 border-gray-200';
            case 2:
                return 'bg-orange-50 border-orange-200';
            default:
                return 'bg-white border-gray-100 hover:bg-gray-50';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-4">
                                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                                    <Trophy className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-white">Ranking</h1>
                                    <p className="text-purple-100">Los mejores estudiantes de Aymara</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-2 bg-white/10 p-1 rounded-xl">
                            <button
                                onClick={() => setActiveTab('global')}
                                className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all duration-200 ${activeTab === 'global'
                                        ? 'bg-white text-indigo-600 shadow-lg'
                                        : 'text-white hover:bg-white/10'
                                    }`}
                            >
                                Global
                            </button>
                            <button
                                onClick={() => setActiveTab('clans')}
                                className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all duration-200 ${activeTab === 'clans'
                                        ? 'bg-white text-indigo-600 shadow-lg'
                                        : 'text-white hover:bg-white/10'
                                    }`}
                            >
                                Clanes
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="space-y-3">
                            {activeTab === 'global' ? (
                                <>
                                    {leaders.map((player, index) => (
                                        <div
                                            key={player.id}
                                            className={`flex items-center p-4 rounded-xl border-2 transition-all duration-200 ${getRowStyle(index)}`}
                                        >
                                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-sm mr-4">
                                                {getRankIcon(index)}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <h3 className="font-bold text-gray-800 text-lg">
                                                        {player.username}
                                                    </h3>
                                                    {index === 0 && (
                                                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                                                            LÍDER
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Nivel {player.level}
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="font-bold text-xl text-indigo-600">
                                                    {player.xp} XP
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {leaders.length === 0 && (
                                        <div className="text-center py-12 text-gray-500">
                                            No hay usuarios en el ranking todavía.
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {CLAN_DATA.map((clan, index) => (
                                        <div
                                            key={clan.id}
                                            className={`flex items-center p-4 rounded-xl border-2 transition-all duration-200 ${getRowStyle(index)}`}
                                        >
                                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-sm mr-4">
                                                {getRankIcon(index)}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <h3 className="font-bold text-gray-800 text-lg">
                                                        {clan.name}
                                                    </h3>
                                                    {index === 0 && (
                                                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                                                            MEJOR CLAN
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {clan.members} miembros
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="font-bold text-xl text-indigo-600">
                                                    {clan.xp} XP
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
