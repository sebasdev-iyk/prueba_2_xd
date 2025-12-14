import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';

const FROG_STAGES = [
  { stage: 0, image: '/cria tu rana/huevo.png', name: 'Huevo' },
  { stage: 1, image: '/cria tu rana/embriones.png', name: 'Embriones' },
  { stage: 2, image: '/cria tu rana/renacuajo2patas.png', name: 'Renacuajo (2 patas)' },
  { stage: 3, image: '/cria tu rana/renacuajo4patas.png', name: 'Renacuajo (4 patas)' },
  { stage: 4, image: '/cria tu rana/rana.png', name: 'Rana Adulta' },
];

export default function FrogTab() {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [viewingStage, setViewingStage] = useState(0);

  useEffect(() => {
    checkFrogStatus();
  }, []);

  useEffect(() => {
    if (profile?.frog_stage !== undefined) {
      setViewingStage(profile.frog_stage);
    }
  }, [profile?.frog_stage]);

  const checkFrogStatus = async () => {
    if (!profile) return;

    try {
      const now = new Date();
      const lastVisit = profile.last_frog_visit ? new Date(profile.last_frog_visit) : null;
      // Default to stage 1 (Embriones) if undefined, simulating 2 days progress
      let newStage = profile.frog_stage ?? 1;

      if (lastVisit) {
        const diffTime = Math.abs(now.getTime() - lastVisit.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // Check if it's a different calendar day
        const isSameDay = now.getDate() === lastVisit.getDate() &&
          now.getMonth() === lastVisit.getMonth() &&
          now.getFullYear() === lastVisit.getFullYear();

        if (!isSameDay) {
          if (diffDays === 1 || (diffDays === 0 && !isSameDay)) {
            // Consecutive day (or next calendar day)
            if (newStage < 4) {
              newStage++;
            }
          } else if (diffDays > 1) {
            // Missed a day
            newStage = 0;
          }
        }
      }

      // Update DB if stage changed or to update last_visit
      // Only update if it's a new visit or stage changed
      if (!lastVisit || newStage !== profile.frog_stage) {
        const { error } = await supabase
          .from('profiles')
          .update({
            frog_stage: newStage,
            last_frog_visit: now.toISOString(),
          })
          .eq('id', profile.id);

        if (error) throw error;
        await refreshProfile();
      }

      setViewingStage(newStage);

    } catch (error) {
      console.error('Error updating frog status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <img src="/carga.gif" alt="Cargando..." className="w-24 h-24" />
      </div>
    );
  }

  const currentStageInfo = FROG_STAGES[viewingStage] || FROG_STAGES[0];
  const currentProfileStage = profile?.frog_stage ?? 1;
  const isLocked = viewingStage > currentProfileStage;

  const handlePrev = () => {
    setViewingStage(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setViewingStage(prev => Math.min(4, prev + 1));
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-blue-100 to-green-100 p-6 overflow-auto">
      <div className="max-w-md mx-auto w-full bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="p-6 text-center">
          <h1 className="text-3xl font-bold text-green-800 mb-2">Cria tu Rana</h1>
          <p className="text-gray-600 mb-6">Visítala todos los días para verla crecer.</p>

          <div className="relative mb-6">
            <div className="aspect-square w-full bg-gradient-to-br from-blue-200 to-green-200 rounded-2xl flex items-center justify-center relative overflow-hidden group">
              {isLocked && (
                <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center backdrop-blur-sm">
                  <Lock className="w-16 h-16 text-white/80" />
                </div>
              )}

              <img
                src={currentStageInfo.image}
                alt={currentStageInfo.name}
                className={`w-3/4 h-3/4 object-contain drop-shadow-2xl transition-transform duration-500 ${!isLocked && 'hover:scale-110'} z-10`}
              />
            </div>

            <button
              onClick={handlePrev}
              disabled={viewingStage === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-colors z-30"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>

            <button
              onClick={handleNext}
              disabled={viewingStage === 4}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-colors z-30"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {isLocked ? '???' : currentStageInfo.name}
          </h2>
          <p className="text-gray-500">Etapa {viewingStage + 1} de 5</p>

          <div className="mt-8 flex justify-center space-x-2">
            {FROG_STAGES.map((s) => (
              <div
                key={s.stage}
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${s.stage === viewingStage
                  ? 'bg-green-600 scale-125'
                  : s.stage <= currentProfileStage
                    ? 'bg-green-400'
                    : 'bg-gray-300'
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
