import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RankingTab from './RankingTab';
import { BookOpen, User, LogOut, Heart, Trophy, ChevronLeft, ChevronRight, Egg, Award } from 'lucide-react';
import LearnTab from './LearnTab';
import ProfileTab from './ProfileTab';
import TaboTab from './TaboTab';
import FrogTab from './FrogTab';
import AchievementsTab from './AchievementsTab';

type Tab = 'learn' | 'tabo' | 'profile' | 'ranking' | 'frog' | 'achievements';

export default function Layout() {
  const [activeTab, setActiveTab] = useState<Tab>('learn');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex">
      <div className={`flex-1 ${activeTab === 'learn' ? 'overflow-hidden' : 'overflow-auto'}`}>
        {activeTab === 'learn' && <LearnTab />}
        {activeTab === 'tabo' && <TaboTab />}
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'ranking' && <RankingTab />}
        {activeTab === 'frog' && <FrogTab />}
        {activeTab === 'achievements' && <AchievementsTab />}
      </div>

      <div
        className={`${isCollapsed ? 'w-20' : 'w-80'} bg-white shadow-2xl border-l border-gray-200 flex flex-col transition-all duration-300 ease-in-out relative`}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -left-3 top-10 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:bg-gray-50 transition-colors z-10"
        >
          {isCollapsed ? (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          )}
        </button>

        <div className={`p-6 border-b border-gray-200 ${isCollapsed ? 'px-2' : ''}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} mb-6`}>
            <div className="bg-green-500 p-2 rounded-lg shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <h1 className="text-xl font-bold text-gray-800 whitespace-nowrap overflow-hidden">
                Jiwasa Aru
              </h1>
            )}
          </div>

          <div className="flex flex-col space-y-2">
            <button
              onClick={() => setActiveTab('learn')}
              className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition duration-200 ${activeTab === 'learn'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              title={isCollapsed ? "Aprender" : ""}
            >
              <BookOpen className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="font-semibold whitespace-nowrap">Aprender</span>}
            </button>

            <button
              onClick={() => setActiveTab('achievements')}
              className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition duration-200 ${activeTab === 'achievements'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              title={isCollapsed ? "Logros" : ""}
            >
              <Award className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="font-semibold whitespace-nowrap">Logros</span>}
            </button>

            <button
              onClick={() => setActiveTab('tabo')}
              className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition duration-200 ${activeTab === 'tabo'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              title={isCollapsed ? "Tambo" : ""}
            >
              <Heart className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="font-semibold whitespace-nowrap">Tambo</span>}
            </button>

            <button
              onClick={() => setActiveTab('ranking')}
              className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition duration-200 ${activeTab === 'ranking'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              title={isCollapsed ? "Ranking" : ""}
            >
              <Trophy className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="font-semibold whitespace-nowrap">Ranking</span>}
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition duration-200 ${activeTab === 'profile'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              title={isCollapsed ? "Perfil" : ""}
            >
              <User className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="font-semibold whitespace-nowrap">Perfil</span>}
            </button>

            <button
              onClick={() => setActiveTab('frog')}
              className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition duration-200 ${activeTab === 'frog'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              title={isCollapsed ? "Cria tu Rana" : ""}
            >
              <Egg className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="font-semibold whitespace-nowrap">Cria tu Rana</span>}
            </button>
          </div>
        </div>

        <div className="flex-1"></div>

        <div className={`p-6 border-t border-gray-200 ${isCollapsed ? 'px-2' : ''}`}>
          <button
            onClick={handleSignOut}
            className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-center space-x-2 px-4'} w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition duration-200`}
            title={isCollapsed ? "Cerrar Sesión" : ""}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="font-semibold whitespace-nowrap">Cerrar Sesión</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
