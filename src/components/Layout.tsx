import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RankingTab from './RankingTab';
import { BookOpen, User, LogOut, Heart, Trophy } from 'lucide-react';
import LearnTab from './LearnTab';
import ProfileTab from './ProfileTab';
import TaboTab from './TaboTab';

type Tab = 'learn' | 'tabo' | 'profile' | 'ranking';

export default function Layout() {
  const [activeTab, setActiveTab] = useState<Tab>('learn');
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
      </div>

      <div className="w-80 bg-white shadow-2xl border-l border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-green-500 p-2 rounded-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">LanguageLearn</h1>
          </div>

          <div className="flex flex-col space-y-2">
            <button
              onClick={() => setActiveTab('learn')}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition duration-200 ${activeTab === 'learn'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="font-semibold">Aprender</span>
            </button>

            <button
              onClick={() => setActiveTab('tabo')}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition duration-200 ${activeTab === 'tabo'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <Heart className="w-5 h-5" />
              <span className="font-semibold">Tambo</span>
            </button>

            <button
              onClick={() => setActiveTab('ranking')}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition duration-200 ${activeTab === 'ranking'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <Trophy className="w-5 h-5" />
              <span className="font-semibold">Ranking</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition duration-200 ${activeTab === 'profile'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <User className="w-5 h-5" />
              <span className="font-semibold">Perfil</span>
            </button>
          </div>
        </div>

        <div className="flex-1"></div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
}
