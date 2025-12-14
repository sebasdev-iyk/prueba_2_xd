import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Lesson, UserProgress } from '../lib/supabase';
import { Lock, ArrowLeft } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import LessonView from './LessonView';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const mapBounds: L.LatLngBoundsExpression = [
  [-16.6428, -70.1134], // Southwest
  [-15.7764, -68.9502]  // Northeast
];

const DESAGUADERO_BOUNDS: L.LatLngBoundsExpression = [
  [-16.57298, -69.04989], // Southwest
  [-16.55982, -69.02521]  // Northeast
];

const FAMILIA_BOUNDS: L.LatLngBoundsExpression = [
  [-16.25551, -69.10233], // Southwest
  [-16.23709, -69.08031]  // Northeast
];

const NUMEROS_BOUNDS: L.LatLngBoundsExpression = [
  [-16.22444, -69.48196], // Southwest
  [-16.20594, -69.44887]  // Northeast
];

const COLORES_BOUNDS: L.LatLngBoundsExpression = [
  [-16.09291, -69.65770], // Southwest
  [-16.06829, -69.62581]  // Northeast
];

const LEVEL_COORDINATES = [
  { name: "Desaguadero Marka", position: [-16.56652, -69.03727] as [number, number] },
  { name: "Juli Marka", position: [-16.21550, -69.46046] as [number, number] },
  { name: "Ilave Marka", position: [-16.08763, -69.63864] as [number, number] },
  { name: "Yunguyo Marka", position: [-16.2463, -69.09132] as [number, number] },
  { name: "Conima Marka", position: [-15.45794, -69.43709] as [number, number] },
  { name: "Chucuito Marka", position: [-15.894558, -69.889923] as [number, number] }
];

const DESAGUADERO_SUBLEVELS = [
  { name: "Saludos", position: [-16.567064, -69.030983] as [number, number], icon: "Hand" },
  { name: "Colores", position: [-16.568442, -69.034229] as [number, number], icon: "Palette" },
  { name: "Animales", position: [-16.567254, -69.035736] as [number, number], icon: "Cat" },
  { name: "Repaso", position: [-16.560181, -69.039620] as [number, number], icon: "Star" }
];

const YUNGUYO_SUBLEVELS = [
  { name: "Nivel A", position: [-16.246933, -69.088267] as [number, number], icon: "Zap" },
  { name: "Nivel B", position: [-16.243292, -69.089515] as [number, number], icon: "Flag" },
  { name: "Nivel C", position: [-16.244309, -69.092672] as [number, number], icon: "Target" },
  { name: "Nivel D", position: [-16.246979, -69.094423] as [number, number], icon: "Trophy" }
];

function FlyToBounds({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.flyToBounds(bounds, {
        padding: [50, 50],
        duration: 2 // Animation duration in seconds
      });
    }
  }, [bounds, map]);

  return null;
}

import CulturaVivaCard from './CulturaVivaCard';

// ... (existing imports)

export default function LearnTab() {
  const { profile, refreshProfile } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetBounds, setTargetBounds] = useState<L.LatLngBoundsExpression | null>(null);
  const [isDesaguaderoExpanded, setIsDesaguaderoExpanded] = useState(false);
  const [isYunguyoExpanded, setIsYunguyoExpanded] = useState(false);
  const [showCulturaCard, setShowCulturaCard] = useState(true);
  const [activeLesson, setActiveLesson] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .order('order_index');

      if (lessonsError) throw lessonsError;

      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*');

      if (progressError) throw progressError;

      const modifiedLessons = (lessonsData || []).map((lesson, index) => {
        if (lesson.title === 'Saludos Básicos') {
          return { ...lesson, title: 'Desaguadero Marka' };
        }
        if (lesson.title === 'Familia') {
          return { ...lesson, title: 'Yunguyo Marka' };
        }
        if (lesson.title === 'Numeros 1-10' || lesson.title === 'Números 1-10') {
          return { ...lesson, title: 'Juli Marka' };
        }
        if (lesson.title === 'Colores') {
          return { ...lesson, title: 'Ilave Marka' };
        }
        if (index === 4) {
          return { ...lesson, title: 'Conima Marka' };
        }
        if (index === 5) {
          return { ...lesson, title: 'Chucuito Marka' };
        }
        return lesson;
      });

      setLessons(modifiedLessons);
      setProgress(progressData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = async (lesson: Lesson) => {
    if (!profile) return;

    if (profile.lives <= 0) {
      alert('¡No tienes vidas! Espera a que se recuperen.');
      return;
    }

    const lessonProgress = progress.find((p) => p.lesson_id === lesson.id);
    const isCompleted = lessonProgress?.completed || false;

    if (isCompleted) {
      alert('¡Ya completaste esta lección!');
      return;
    }

    const earnedStars = Math.floor(Math.random() * 3) + 1;
    const success = Math.random() > 0.3;

    if (success) {
      const newXp = profile.xp + lesson.xp_reward;
      const newLevel = Math.floor(newXp / 100) + 1;

      await supabase
        .from('profiles')
        .update({ xp: newXp, level: newLevel })
        .eq('id', profile.id);

      if (lessonProgress) {
        await supabase
          .from('user_progress')
          .update({
            completed: true,
            stars: earnedStars,
            completed_at: new Date().toISOString(),
          })
          .eq('id', lessonProgress.id);
      } else {
        await supabase.from('user_progress').insert({
          user_id: profile.id,
          lesson_id: lesson.id,
          completed: true,
          stars: earnedStars,
          completed_at: new Date().toISOString(),
        });
      }

      alert(`¡Excelente! Ganaste ${earnedStars} estrellas y ${lesson.xp_reward} XP`);
      await refreshProfile();
      await fetchData();
    } else {
      const newLives = Math.max(0, profile.lives - 1);
      await supabase
        .from('profiles')
        .update({ lives: newLives })
        .eq('id', profile.id);

      alert('¡Intenta de nuevo! Perdiste una vida.');
      await refreshProfile();
    }
  };

  const isLessonUnlocked = (_lesson: Lesson) => {
    return true; // Temporarily unlocked for testing
  };

  const getLessonIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[
      iconName.charAt(0).toUpperCase() + iconName.slice(1)
    ] as React.ComponentType<any>;
    return Icon || LucideIcons.BookOpen;
  };

  const createCustomMarkerIcon = (title: string, iconName: string, isUnlocked: boolean, isCompleted: boolean, stars: number, color: string = 'blue') => {
    const Icon = getLessonIcon(iconName);

    const colorMap: Record<string, string> = {
      blue: '#3b82f6',
      green: '#22c55e',
      red: '#ef4444',
      purple: '#a855f7',
      yellow: '#eab308',
      gray: '#9ca3af'
    };

    const bgColor = isCompleted ? colorMap['yellow'] : (isUnlocked ? (colorMap[color] || colorMap['blue']) : colorMap['gray']);

    const iconMarkup = renderToStaticMarkup(
      <div className="relative flex flex-col items-center justify-center">
        <div
          style={{ backgroundColor: bgColor }}
          className={`w-16 h-16 rounded-full shadow-xl flex items-center justify-center border-4 border-white transition-transform hover:scale-110 ${!isUnlocked ? 'opacity-75' : ''} overflow-hidden`}
        >
          {(() => {
            const SECTION_ICONS: Record<string, string> = {
              'Conima Marka': '/iconos/ConimaIcono.png',
              'Chucuito Marka': '/iconos/ChucuitoIcono.png',
              'Juli Marka': '/iconos/Juli_Icono.png',
              'Yunguyo Marka': '/iconos/YunguyoIcono.png',
              'Desaguadero Marka': '/iconos/DesaguaderoIcono.png',
              'Ilave Marka': '/ilave-marka.jpeg'
            };

            const iconPath = SECTION_ICONS[title];

            if (iconPath) {
              return (
                <img
                  src={iconPath}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              );
            }

            return isUnlocked ? (
              <Icon size={32} color="white" />
            ) : (
              <Lock size={32} color="white" />
            );
          })()}
        </div>
        {isCompleted && (
          <div className="flex mt-1 space-x-0.5 bg-white/80 rounded-full px-2 py-0.5 shadow-sm">
            {[...Array(stars)].map((_, i) => (
              <div key={i} style={{ color: '#eab308' }}>★</div>
            ))}
          </div>
        )}
        <div className="mt-1 bg-white/90 px-2 py-1 rounded text-xs font-bold shadow-md whitespace-nowrap">
          {title}
        </div>
      </div>
    );

    return L.divIcon({
      html: iconMarkup,
      className: 'custom-marker-icon',
      iconSize: [80, 100],
      iconAnchor: [40, 50]
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
    <div className="h-full flex flex-col relative">
      {activeLesson && (
        <LessonView
          lessonTitle={activeLesson}
          onComplete={(score) => {
            console.log(`Lesson ${activeLesson} completed with score ${score}`);
            setActiveLesson(null);
            // Here you would update the backend progress
          }}
          onClose={() => setActiveLesson(null)}
        />
      )}

      {(isDesaguaderoExpanded || isYunguyoExpanded) && (
        <button
          onClick={() => {
            setIsDesaguaderoExpanded(false);
            setIsYunguyoExpanded(false);
            setTargetBounds(mapBounds);
          }}
          className="absolute top-6 left-6 bg-white p-3 rounded-full shadow-lg z-[1000] hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
      )}

      {isDesaguaderoExpanded && showCulturaCard && (
        <CulturaVivaCard onClose={() => setShowCulturaCard(false)} />
      )}

      <div className="absolute top-6 right-6 bg-white rounded-2xl shadow-lg px-6 py-4 flex items-center space-x-3 z-[1000]">
        <div className="flex items-center space-x-1">
          {[...Array(profile?.lives ?? 0)].map((_, i) => (
            <img
              key={i}
              src="/sancallos/sancayoConRelleno.png"
              alt="Life"
              className="w-8 h-8 object-contain"
            />
          ))}
        </div>
      </div>

      <div className="flex-1 w-full h-full relative z-0 border-8 border-white rounded-3xl overflow-hidden">
        <MapContainer
          bounds={[[-16.686, -70.145], [-15.236, -68.879]]}
          maxBounds={[[-16.686, -70.145], [-15.236, -68.879]]}
          className="w-full h-full"
          zoomControl={false}
          minZoom={8}
        >
          <FlyToBounds bounds={targetBounds} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Main Level Markers */}
          {lessons.map((lesson, idx) => {
            const coordinate = LEVEL_COORDINATES[idx];
            if (!coordinate) return null;

            // Hide Desaguadero Marka if expanded
            if (idx === 0 && isDesaguaderoExpanded) return null;
            // Hide Yunguyo Marka if expanded
            if (idx === 3 && isYunguyoExpanded) return null;

            const lessonProgress = progress.find((p) => p.lesson_id === lesson.id);
            const isUnlocked = isLessonUnlocked(lesson);
            const isCompleted = lessonProgress?.completed || false;
            const stars = lessonProgress?.stars || 0;

            return (
              <Marker
                key={lesson.id}
                position={coordinate.position}
                icon={createCustomMarkerIcon(lesson.title, lesson.icon, isUnlocked, isCompleted, stars, lesson.color)}
                eventHandlers={{
                  click: () => {
                    if (isUnlocked) {
                      if (idx === 0) { // Desaguadero Marka
                        setTargetBounds(DESAGUADERO_BOUNDS);
                        setIsDesaguaderoExpanded(true);
                      } else if (idx === 1) { // Juli Marka
                        setTargetBounds(NUMEROS_BOUNDS);
                        setTimeout(() => handleLessonClick(lesson), 2000);
                      } else if (idx === 2) { // Ilave Marka
                        setTargetBounds(COLORES_BOUNDS);
                        setTimeout(() => handleLessonClick(lesson), 2000);
                      } else if (idx === 3) { // Yunguyo Marka
                        setTargetBounds(FAMILIA_BOUNDS);
                        setIsYunguyoExpanded(true);
                      } else {
                        handleLessonClick(lesson);
                      }
                    } else {
                      alert("¡Esta lección está bloqueada! Completa la anterior primero.");
                    }
                  }
                }}
              />
            );
          })}

          {/* Desaguadero Sub-levels */}
          {isDesaguaderoExpanded && (
            <>
              {DESAGUADERO_SUBLEVELS.map((subLevel, idx) => (
                <Marker
                  key={`sub-${idx}`}
                  position={subLevel.position}
                  icon={createCustomMarkerIcon(subLevel.name, subLevel.icon, true, false, 0, 'green')}
                  eventHandlers={{
                    click: () => {
                      if (subLevel.name === 'Saludos') {
                        setActiveLesson('Saludos');
                      } else if (subLevel.name === 'Colores') {
                        setActiveLesson('Colores');
                      } else {
                        alert(`Has seleccionado el nivel: ${subLevel.name}`);
                      }
                    }
                  }}
                />
              ))}
              <Polyline
                positions={DESAGUADERO_SUBLEVELS.map(l => l.position)}
                pathOptions={{ color: '#a855f7', weight: 4, dashArray: '10, 10', opacity: 0.8 }}
              />
            </>
          )}

          {/* Yunguyo Sub-levels */}
          {isYunguyoExpanded && (
            <>
              {YUNGUYO_SUBLEVELS.map((subLevel, idx) => (
                <Marker
                  key={`yunguyo-sub-${idx}`}
                  position={subLevel.position}
                  icon={createCustomMarkerIcon(subLevel.name, subLevel.icon, true, false, 0, 'purple')}
                  eventHandlers={{
                    click: () => {
                      alert(`Has seleccionado el nivel: ${subLevel.name}`);
                    }
                  }}
                />
              ))}
              <Polyline
                positions={YUNGUYO_SUBLEVELS.map(l => l.position)}
                pathOptions={{ color: '#a855f7', weight: 5, dashArray: '10, 10', opacity: 0.8 }}
              />
            </>
          )}

        </MapContainer>
      </div>
    </div>
  );
}
