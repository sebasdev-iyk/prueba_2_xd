import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Check, X, Trophy } from 'lucide-react';

type QuizQuestion = {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_answer: string;
};

export default function TaboTab() {
  const { profile, refreshProfile } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [livesRecovered, setLivesRecovered] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quizComplete, setQuizComplete] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')

        .limit(5);

      if (error) throw error;
      const newQuestions: QuizQuestion[] = [
        {
          id: 'custom-1',
          question: '¿Qué danza emblemática de Puno representa la lucha entre el bien y el mal, y es protagonizada por el Arcángel San Miguel enfrentándose a una legión de demonios?',
          option_a: 'La Morenada',
          option_b: 'La Diablada',
          option_c: 'Los Caporales',
          correct_answer: 'B'
        },
        {
          id: 'custom-2',
          question: 'Además de los Uros, ¿qué isla del Lago Titicaca es mundialmente famosa por su fino arte textil, el cual fue proclamado como "Obra Maestra del Patrimonio Oral e Inmaterial de la Humanidad" por la UNESCO?',
          option_a: 'Isla Amantaní',
          option_b: 'Isla del Sol',
          option_c: 'Isla Taquile',
          correct_answer: 'C'
        }
      ];

      setQuestions([...(data || []), ...newQuestions]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setLoading(false);
    }
  };

  const handleAnswer = async (option: 'A' | 'B' | 'C') => {
    if (!profile || answered) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = option === currentQuestion.correct_answer;

    setSelectedAnswer(option);
    setAnswered(true);

    if (isCorrect) {
      const newRecovered = livesRecovered + 1;
      setLivesRecovered(newRecovered);

      if (profile.lives < 5) {
        const newLives = Math.min(5, profile.lives + 1);
        await supabase
          .from('profiles')
          .update({ lives: newLives })
          .eq('id', profile.id);

        await refreshProfile();
      }
    }

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setAnswered(false);
      } else {
        setQuizComplete(true);
      }
    }, 1500);
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setLivesRecovered(0);
    setQuizComplete(false);
    fetchQuestions();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <img src="/carga.gif" alt="Cargando..." className="w-24 h-24" />
      </div>
    );
  }

  if (quizComplete) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-800 mb-4">¡Cuestionario Completo!</h1>
          <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-xl p-6 mb-6">
            <p className="text-gray-600 text-sm mb-2">Vidas Recuperadas</p>
            <div className="flex items-center justify-center space-x-1">
              {[...Array(livesRecovered)].map((_, i) => (
                <img
                  key={i}
                  src="/sancallos/sancayoConRelleno.png"
                  alt="Recovered Life"
                  className="w-8 h-8 object-contain"
                />
              ))}
              <span className="text-5xl font-bold text-gray-800 ml-2">+{livesRecovered}</span>
            </div>
          </div>

          <div className="bg-gray-100 rounded-xl p-4 mb-6">
            <p className="text-gray-600 text-sm mb-1">Vidas Totales</p>
            <p className="text-3xl font-bold text-gray-800">{profile?.lives} / 5</p>
          </div>

          <button
            onClick={handleRestart}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition duration-200"
          >
            Intentar de Nuevo
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600 text-lg">No hay preguntas disponibles</div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const options = [
    { key: 'A', text: currentQuestion.option_a },
    { key: 'B', text: currentQuestion.option_b },
    { key: 'C', text: currentQuestion.option_c },
  ];

  const getOptionStyle = (key: string) => {
    if (!answered) {
      return 'bg-white border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer';
    }

    if (key === currentQuestion.correct_answer) {
      return 'bg-green-100 border-2 border-green-500';
    }

    if (key === selectedAnswer && selectedAnswer !== currentQuestion.correct_answer) {
      return 'bg-red-100 border-2 border-red-500';
    }

    return 'bg-gray-100 border-2 border-gray-300';
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Recuperar Vidas</h1>
          <p className="text-gray-600">Responde correctamente para ganar vidas</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-semibold text-gray-600">
                Pregunta {currentQuestionIndex + 1} de {questions.length}
              </span>
              <div className="flex items-center space-x-1 bg-white/50 px-4 py-2 rounded-full">
                {[...Array(profile?.lives ?? 0)].map((_, i) => (
                  <img
                    key={i}
                    src="/sancallos/sancayoConRelleno.png"
                    alt="Life"
                    className="w-6 h-6 object-contain"
                  />
                ))}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">
              {currentQuestion.question}
            </h2>

            <div className="space-y-4">
              {options.map((option) => (
                <button
                  key={option.key}
                  onClick={() => handleAnswer(option.key as 'A' | 'B' | 'C')}
                  disabled={answered}
                  className={`w-full p-4 rounded-xl text-left transition-all duration-200 font-semibold ${getOptionStyle(
                    option.key
                  )}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${answered
                          ? option.key === currentQuestion.correct_answer
                            ? 'bg-green-500'
                            : option.key === selectedAnswer
                              ? 'bg-red-500'
                              : 'bg-gray-300'
                          : 'bg-blue-500'
                          } text-white font-bold`}
                      >
                        {option.key}
                      </div>
                      <span className="text-lg">{option.text}</span>
                    </div>
                    {answered && (
                      <div>
                        {option.key === currentQuestion.correct_answer && (
                          <Check className="w-6 h-6 text-green-500" />
                        )}
                        {option.key === selectedAnswer &&
                          selectedAnswer !== currentQuestion.correct_answer && (
                            <X className="w-6 h-6 text-red-500" />
                          )}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-100 to-green-100 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600">Vidas Recuperadas en este Cuestionario</p>
            <div className="flex items-center justify-center space-x-1 mt-2">
              {[...Array(livesRecovered)].map((_, i) => (
                <img
                  key={i}
                  src="/sancallos/sancayoConRelleno.png"
                  alt="Recovered Life"
                  className="w-6 h-6 object-contain"
                />
              ))}
              <span className="text-3xl font-bold text-gray-800 ml-2">+{livesRecovered}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
