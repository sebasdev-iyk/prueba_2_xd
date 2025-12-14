import { useEffect, useState } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { Trophy, MapPin, Users, X, ChevronRight, Calendar, Award, Facebook, Instagram, Twitter } from 'lucide-react';

// Extended Profile type for local use with mock data
interface ExtendedProfile extends Profile {
    origin_city?: string;
    residence_city?: string;
    socials?: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
    };
}

const ORIGIN_CITIES = ['Desaguadero', 'Juli', 'Chucuito', 'Ilave', 'Conima', 'Yunguyo'];
const RESIDENCE_CITIES = ['Lima', 'Arequipa', 'La Paz', 'El Alto', 'Tacna', 'Puno'];

export default function RankingTab() {
    const [leaders, setLeaders] = useState<ExtendedProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<'origin' | 'residence' | null>(null);
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<ExtendedProfile | null>(null);

    const MOCK_USERS: ExtendedProfile[] = [
        { id: 'mock1', username: 'AymaraMaster', xp: 15000, level: 42, lives: 5, current_language: 'aymara', created_at: '2024-01-15T10:00:00Z', updated_at: '', frog_stage: 0, last_frog_visit: null, origin_city: 'Desaguadero', residence_city: 'Lima', socials: { facebook: 'aymaramaster', instagram: 'aymaramaster' } },
        { id: 'mock2', username: 'TiticacaExplorer', xp: 12500, level: 35, lives: 5, current_language: 'aymara', created_at: '2024-02-20T14:30:00Z', updated_at: '', frog_stage: 0, last_frog_visit: null, origin_city: 'Juli', residence_city: 'Arequipa', socials: { twitter: 'titicacaexp' } },
        { id: 'mock3', username: 'AndeanEagle', xp: 9800, level: 28, lives: 5, current_language: 'aymara', created_at: '2024-03-10T09:15:00Z', updated_at: '', frog_stage: 0, last_frog_visit: null, origin_city: 'Ilave', residence_city: 'La Paz', socials: { facebook: 'andeaneagle', instagram: 'andeaneagle', twitter: 'andeaneagle' } },
        { id: 'mock4', username: 'LlamaLover', xp: 5400, level: 15, lives: 5, current_language: 'aymara', created_at: '2024-04-05T16:45:00Z', updated_at: '', frog_stage: 0, last_frog_visit: null, origin_city: 'Conima', residence_city: 'El Alto' },
        { id: 'mock5', username: 'CocaLeaf', xp: 2100, level: 8, lives: 5, current_language: 'aymara', created_at: '2024-05-12T11:20:00Z', updated_at: '', frog_stage: 0, last_frog_visit: null, origin_city: 'Yunguyo', residence_city: 'Tacna', socials: { instagram: 'cocaleaf_official' } },
        { id: 'mock6', username: 'SuriRunner', xp: 18000, level: 45, lives: 5, current_language: 'aymara', created_at: '2023-12-01T08:00:00Z', updated_at: '', frog_stage: 0, last_frog_visit: null, origin_city: 'Desaguadero', residence_city: 'Lima', socials: { facebook: 'surirunner' } },
        { id: 'mock7', username: 'AlpacaKing', xp: 11000, level: 30, lives: 5, current_language: 'aymara', created_at: '2024-01-25T13:10:00Z', updated_at: '', frog_stage: 0, last_frog_visit: null, origin_city: 'Chucuito', residence_city: 'Puno', socials: { twitter: 'alpacaking' } },
        { id: 'mock8', username: 'CondorWings', xp: 7500, level: 20, lives: 5, current_language: 'aymara', created_at: '2024-03-15T15:55:00Z', updated_at: '', frog_stage: 0, last_frog_visit: null, origin_city: 'Juli', residence_city: 'Arequipa', socials: { instagram: 'condorwings' } },
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

            // Merge real users with mock data to ensure we have cities and socials
            const allUsers = [...realUsers, ...MOCK_USERS].map(user => ({
                ...user,
                origin_city: user.origin_city || ORIGIN_CITIES[Math.floor(Math.random() * ORIGIN_CITIES.length)],
                residence_city: user.residence_city || RESIDENCE_CITIES[Math.floor(Math.random() * RESIDENCE_CITIES.length)],
                created_at: user.created_at || new Date().toISOString(),
                socials: user.socials || (Math.random() > 0.5 ? { instagram: user.username.toLowerCase() } : undefined)
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

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Fecha desconocida';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
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
                                    <div
                                        key={user.id}
                                        onClick={() => setSelectedUser(user)}
                                        className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-purple-50 hover:border-purple-200 transition-all"
                                    >
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
                                    <div
                                        key={user.id}
                                        onClick={() => setSelectedUser(user)}
                                        className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all"
                                    >
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
                                                    <div
                                                        key={user.id}
                                                        onClick={() => setSelectedUser(user)}
                                                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                                                    >
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

            {/* User Profile Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
                        <button
                            onClick={() => setSelectedUser(null)}
                            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-1 z-10"
                        >
                            <X size={24} />
                        </button>

                        <div className="bg-gradient-to-r from-green-400 to-blue-500 p-8 text-center">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mx-auto mb-4">
                                <span className="text-4xl font-bold text-green-500">
                                    {selectedUser.username.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-1">{selectedUser.username}</h2>
                            <div className="flex items-center justify-center space-x-2 text-white/90 text-sm">
                                <Calendar className="w-4 h-4" />
                                <span>Miembro desde {formatDate(selectedUser.created_at)}</span>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 rounded-xl p-4 text-center">
                                    <div className="flex items-center justify-center gap-2 mb-1 text-blue-600">
                                        <Award className="w-5 h-5" />
                                        <span className="font-bold text-sm">Nivel</span>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-800">{selectedUser.level}</div>
                                </div>
                                <div className="bg-green-50 rounded-xl p-4 text-center">
                                    <div className="flex items-center justify-center gap-2 mb-1 text-green-600">
                                        <Trophy className="w-5 h-5" />
                                        <span className="font-bold text-sm">XP Total</span>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-800">{selectedUser.xp}</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <span className="text-gray-600 font-medium">Origen</span>
                                    </div>
                                    <span className="font-bold text-gray-800">{selectedUser.origin_city || 'No especificado'}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <span className="text-gray-600 font-medium">Residencia</span>
                                    </div>
                                    <span className="font-bold text-gray-800">{selectedUser.residence_city || 'No especificado'}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-red-100 p-2 rounded-lg text-red-600">
                                            {/* <Heart className="w-5 h-5" /> */}
                                            <img src="/sancallos/sancayoConRelleno.png" alt="Life" className="w-5 h-5 object-contain" />
                                        </div>
                                        <span className="text-gray-600 font-medium">Vidas</span>
                                    </div>
                                    <div className="flex gap-1">
                                        {[...Array(selectedUser.lives)].map((_, i) => (
                                            <img key={i} src="/sancallos/sancayoConRelleno.png" alt="Life" className="w-6 h-6 object-contain" />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Social Networks */}
                            {selectedUser.socials && (
                                <div className="border-t border-gray-100 pt-6">
                                    <h3 className="text-center text-gray-500 text-sm font-medium mb-4">Redes Sociales</h3>
                                    <div className="flex justify-center space-x-4">
                                        {selectedUser.socials.facebook && (
                                            <a
                                                href={`https://facebook.com/${selectedUser.socials.facebook}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 bg-[#1877F2] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform shadow-md"
                                            >
                                                <Facebook size={20} />
                                            </a>
                                        )}
                                        {selectedUser.socials.instagram && (
                                            <a
                                                href={`https://instagram.com/${selectedUser.socials.instagram}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform shadow-md"
                                            >
                                                <Instagram size={20} />
                                            </a>
                                        )}
                                        {selectedUser.socials.twitter && (
                                            <a
                                                href={`https://twitter.com/${selectedUser.socials.twitter}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform shadow-md"
                                            >
                                                <Twitter size={20} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
