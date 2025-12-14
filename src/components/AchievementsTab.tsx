import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Award } from 'lucide-react';

export default function AchievementsTab() {
    const { profile } = useAuth();
    const [unlockedImages, setUnlockedImages] = useState({
        part1: false, // Saludos
        part2: false, // Colores
        part3: false  // Animales
    });

    useEffect(() => {
        if (profile) {

            const coloresCompleted = localStorage.getItem(`progress_${profile.id}_Colores`) === 'true';
            const animalesCompleted = localStorage.getItem(`progress_${profile.id}_Animales`) === 'true';

            setUnlockedImages({
                part1: true, // Always unlocked by default
                part2: coloresCompleted,
                part3: animalesCompleted
            });
        }
    }, [profile]);

    return (
        <div className="h-full bg-gray-50 p-6 overflow-y-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center">
                <Award className="w-8 h-8 mr-3 text-yellow-500" />
                Logros y Coleccionables
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Desaguadero Marka Card */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-green-100 transform transition hover:scale-[1.02]">
                    <div className="bg-green-500 p-4">
                        <h2 className="text-xl font-bold text-white flex justify-between items-center">
                            Desaguadero Marka
                            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Colección 1/1</span>
                        </h2>
                    </div>

                    <div className="p-6">
                        <div className="relative w-full aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden shadow-inner border border-gray-200 flex flex-col">
                            {/* Part 1 (Top) - Saludos */}
                            <div className="flex-1 relative overflow-hidden border-b border-white/20">
                                <img
                                    src="/logros/parte1.jpeg"
                                    alt="Logro Parte 1"
                                    className={`w-full h-full object-cover transition-all duration-1000 ${unlockedImages.part1 ? '' : 'blur-md grayscale opacity-50'}`}
                                />
                                {!unlockedImages.part1 && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                        <Lock className="text-white/80 w-8 h-8 drop-shadow-lg" />
                                    </div>
                                )}
                            </div>

                            {/* Part 2 (Middle) - Colores */}
                            <div className="flex-1 relative overflow-hidden border-b border-white/20">
                                <img
                                    src="/logros/parte2.jpeg"
                                    alt="Logro Parte 2"
                                    className={`w-full h-full object-cover transition-all duration-1000 ${unlockedImages.part2 ? '' : 'blur-md grayscale opacity-50'}`}
                                />
                                {!unlockedImages.part2 && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                        <Lock className="text-white/80 w-8 h-8 drop-shadow-lg" />
                                    </div>
                                )}
                            </div>

                            {/* Part 3 (Bottom) - Animales */}
                            <div className="flex-1 relative overflow-hidden">
                                <img
                                    src="/logros/parte3.jpeg"
                                    alt="Logro Parte 3"
                                    className={`w-full h-full object-cover transition-all duration-1000 ${unlockedImages.part3 ? '' : 'blur-md grayscale opacity-50'}`}
                                />
                                {!unlockedImages.part3 && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                        <Lock className="text-white/80 w-8 h-8 drop-shadow-lg" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 space-y-2">
                            <div className="flex items-center text-sm text-gray-600">
                                <div className={`w-3 h-3 rounded-full mr-2 ${unlockedImages.part1 ? 'bg-green-500' : 'bg-gray-300'}`} />
                                <span>Saludos Básicos</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                                <div className={`w-3 h-3 rounded-full mr-2 ${unlockedImages.part2 ? 'bg-green-500' : 'bg-gray-300'}`} />
                                <span>Colores</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                                <div className={`w-3 h-3 rounded-full mr-2 ${unlockedImages.part3 ? 'bg-green-500' : 'bg-gray-300'}`} />
                                <span>Animales</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Locked Cards for other Markas */}
                {['Yunguyo Marka', 'Juli Marka', 'Ilave Marka', 'Conima Marka', 'Chucuito Marka'].map((marka) => (
                    <div key={marka} className="bg-gray-100 rounded-2xl shadow-sm overflow-hidden border-2 border-gray-200 opacity-70 relative">
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-100/50 backdrop-blur-[2px]">
                            <div className="bg-white p-4 rounded-full shadow-lg">
                                <Lock className="w-8 h-8 text-gray-400" />
                            </div>
                        </div>
                        <div className="bg-gray-300 p-4">
                            <h2 className="text-xl font-bold text-gray-500">{marka}</h2>
                        </div>
                        <div className="p-6 h-64 flex items-center justify-center">
                            <span className="text-gray-400 font-medium">Próximamente</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
