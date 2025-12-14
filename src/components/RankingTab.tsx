import { useEffect, useState } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { Trophy, MapPin, Users, X, ChevronRight } from 'lucide-react';

// Extended Profile type for local use with mock data
interface ExtendedProfile extends Profile {
    origin_city?: string;
    residence_city?: string;
}

const ORIGIN_CITIES = ['Desaguadero', 'Juli', 'Chucuito', 'Ilave', 'Conima', 'Yunguyo'];
const RESIDENCE_CITIES = ['Lima', 'Arequipa', 'La Paz', 'El Alto', 'Tacna', 'Puno'];

export default function RankingTab() {
    const [leaders, setLeaders] = useState<ExtendedProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<'origin' | 'residence' | null>(null);
    const [selectedCity, setSelectedCity] = useState<string | null>(null);

    const MOCK_USERS: ExtendedProfile[] = [
        { id: 'mock1', username: 'AymaraMaster', xp: 15000, level: 42, lives: 5, current_language: 'aymara', created_at: '', updated_at: '', frog_stage: 0, last_frog_visit: null, origin_city: 'Desaguadero', residence_city: 'Lima' },
        { id: 'mock2', username: 'TiticacaExplorer', xp: 12500, level: 35, lives: 5, current_language: 'aymara', created_at: '', updated_at: '', frog_stage: 0, last_frog_visit: null, origin_city: 'Juli', residence_city: 'Arequipa' },
        { id: 'mock3', username: 'AndeanEagle', xp: 9800, level: 28, lives: 5, current_language: 'aymara', created_at: '', updated_at: '', frog_stage: 0, last_frog_visit: null, origin_city: 'Ilave', residence_city: 'La Paz' },
        { id: 'mock4', username: 'LlamaLover', xp: 5400, level: 15, lives: 5, current_language: 'aymara', created_at: '', updated_at: '', frog_stage: 0, last_frog_visit: null, origin_city: 'Conima', residence_city: 'El Alto' },
        { id: 'mock5', username: 'CocaLeaf', xp: 2100, level: 8, lives: 5, current_language: 'aymara', created_at: '', updated_at: '', frog_stage: 0, last_frog_visit: null, origin_city: 'Yunguyo', residence_city: 'Tacna' },
        { id: 'mock6', username: 'SuriRunner', xp: 18000, level: 45, lives: 5, current_language: 'aymara', created_at: '', updated_at: '', frog_stage: 0, last_frog_visit: null, origin_city: 'Desaguadero', residence_city: 'Lima' },
        { id: 'mock7', username: 'AlpacaKing', xp: 11000, level: 30, lives: 5, current_language: 'aymara', created_at: '', updated_at: '', frog_stage: 0, last_frog_visit: null, origin_city: 'Chucuito', residence_city: 'Puno' },
        { id: 'mock8', username: 'CondorWings', xp: 7500, level: 20, lives: 5, current_language: 'aymara', created_at: '', updated_at: '', frog_stage: 0, last_frog_visit: null, origin_city: 'Juli', residence_city: 'Arequipa' },
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
                .limit(20);

            if (error) throw error;

            const realUsers = (data || []) as ExtendedProfile[];

            // Merge real users with mock data to ensure we have cities
            // In a real app, we would fetch this from the DB
            const allUsers = [...realUsers, ...MOCK_USERS].map(user => ({
                ...user,
                origin_city: user.origin_city || ORIGIN_CITIES[Math.floor(Math.random() * ORIGIN_CITIES.length)],
                residence_city: user.residence_city || RESIDENCE_CITIES[Math.floor(Math.random() * RESIDENCE_CITIES.length)]
            })).sort((a, b) => b.xp - a.xp);

            // Deduplicate by ID
            const uniqueUsers = Array.from(new Map(allUsers.map(item => [item.id, item])).values());

            setLeaders(uniqueUsers);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            setLeaders(MOCK_USERS);
        } finally {
            setLoading(false);
        }
    };

    const getTopUsersByCity = (city: string, type: 'origin' | 'residence') => {
        return leaders
            .filter(user => (type === 'origin' ? user.origin_city : user.residence_city) === city)
            .sort((a, b) => b.xp - a.xp);
    };

    const getTopGlobalByOrigin = () => {
        // Filter users who belong to one of the origin cities
        return leaders
            .filter(user => user.origin_city && ORIGIN_CITIES.includes(user.origin_city))
            .sort((a, b) => b.xp - a.xp)
            .slice(0, 2);
    };

    const getTopGlobalByResidence = () => {
        // Filter users who belong to one of the residence cities (not origin cities)
        return leaders
            .filter(user => user.residence_city && RESIDENCE_CITIES.includes(user.residence_city))
            .sort((a, b) => b.xp - a.xp)
            .slice(0, 2);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <img src="/carga.gif" alt="Cargando..." className="w-24 h-24" />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 pb-24 bg-gray-50">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
                        <Trophy className="text-yellow-500 w-8 h-8" />
                        Ranking Global
                    </h1>
                    <p className="text-gray-600">Descubre a los mejores estudiantes de la comunidad</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Card - Origin */}
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-purple-100 flex flex-col">
                        <div className="bg-purple-600 p-6 text-white">
                            <h2 className="text-xl font-bold">Según su lugar de origen:</h2>
                            <p className="text-purple-200 text-sm font-medium">JiwasaAru, Jiwasa Yati</p>
                        </div>

                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex flex-wrap gap-2 mb-6">
                                {ORIGIN_CITIES.map(city => (
                                    <span key={city} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold border border-purple-100">
                                        {city}
                                    </span>
                                ))}
                            </div>

                            <div className="flex-1 space-y-4 mb-6">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Top Global (Origen)</h3>
                                {getTopGlobalByOrigin().map((user, idx) => (
                                    <div key={user.id} className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold mr-3">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-gray-800">{user.username}</div>
                                            <div className="text-xs text-gray-500">{user.origin_city}</div>
                                        </div>
                                        <div className="font-bold text-purple-600">{user.xp} XP</div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setSelectedCategory('origin')}
                                className="w-full py-3 bg-purple-100 text-purple-700 rounded-xl font-bold hover:bg-purple-200 transition flex items-center justify-center gap-2"
                            >
                                Ver más <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Right Card - Residence */}
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-blue-100 flex flex-col">
                        <div className="bg-blue-600 p-6 text-white">
                            <h2 className="text-xl font-bold">Según el sitio en que radicas:</h2>
                            <p className="text-blue-200 text-sm font-medium">Comunidad Global</p>
                        </div>

                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex flex-wrap gap-2 mb-6">
                                {RESIDENCE_CITIES.slice(0, 6).map(city => (
                                    <span key={city} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
                                        {city}
                                    </span>
                                ))}
                            </div>

                            <div className="flex-1 space-y-4 mb-6">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Top Global (Residencia)</h3>
                                {getTopGlobalByResidence().map((user, idx) => (
                                    <div key={user.id} className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-gray-800">{user.username}</div>
                                            <div className="text-xs text-gray-500">{user.residence_city}</div>
                                        </div>
                                        <div className="font-bold text-blue-600">{user.xp} XP</div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setSelectedCategory('residence')}
                                className="w-full py-3 bg-blue-100 text-blue-700 rounded-xl font-bold hover:bg-blue-200 transition flex items-center justify-center gap-2"
                            >
                                Ver más <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for Details */}
            {selectedCategory && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                        <div className={`p-6 flex justify-between items-center ${selectedCategory === 'origin' ? 'bg-purple-600' : 'bg-blue-600'} text-white`}>
                            <div>
                                <h2 className="text-2xl font-bold">
                                    {selectedCategory === 'origin' ? 'Ranking por Lugar de Origen' : 'Ranking por Lugar de Residencia'}
                                </h2>
                                <p className="opacity-80">
                                    {selectedCategory === 'origin' ? 'JiwasaAru, Jiwasa Yati' : 'Comunidad Global'}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedCategory(null);
                                    setSelectedCity(null);
                                }}
                                className="p-2 hover:bg-white/20 rounded-full transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-6 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {(selectedCategory === 'origin' ? ORIGIN_CITIES : RESIDENCE_CITIES).map(city => {
                                    const cityUsers = getTopUsersByCity(city, selectedCategory);
                                    if (cityUsers.length === 0) return null;

                                    return (
                                        <div key={city} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                                            <div className={`p-3 font-bold text-center ${selectedCategory === 'origin' ? 'bg-purple-50 text-purple-800' : 'bg-blue-50 text-blue-800'}`}>
                                                {city}
                                            </div>
                                            <div className="p-4 space-y-3 flex-1">
                                                {cityUsers.map((user, idx) => (
                                                    <div key={user.id} className="flex items-center gap-3">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                                idx === 1 ? 'bg-gray-100 text-gray-700' :
                                                                    idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-500'
                                                            }`}>
                                                            {idx + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="truncate font-medium text-gray-800 text-sm">{user.username}</div>
                                                        </div>
                                                        <div className="text-xs font-bold text-gray-500">{user.xp} XP</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
