import { useState, useEffect, useRef } from 'react';
import { X, Check, RefreshCw, Share2, Copy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export type QuestionType = 'multiple-choice' | 'completion' | 'matching' | 'true-false' | 'text-input';

export interface Question {
    id: string;
    type: QuestionType;
    question: string;
    correctAnswer: string | string[]; // For matching, this could be a JSON string or specific structure
    options?: string[]; // For multiple choice
    pairs?: { left: string; right: string }[]; // For matching
}

interface LessonViewProps {
    lessonTitle: string;
    onComplete: (score: number) => void;
    onClose: () => void;
}

// Hardcoded data for "Saludos"
const SALUDOS_QUESTIONS: Question[] = [
    {
        id: '1',
        type: 'multiple-choice',
        question: '¿Cómo se dice "Hola" en aymara?',
        options: ['Kamisaraki', 'Waliki', 'Jikisiñkama', 'Aski urukipana'],
        correctAnswer: 'Kamisaraki'
    },
    {
        id: '2',
        type: 'completion',
        question: 'Completa el saludo: "__ urukipana" (Buenos días)',
        options: ['Aski', 'Waliki', 'Suma', 'Jach’a'],
        correctAnswer: 'Aski'
    },
    {
        id: '3',
        type: 'multiple-choice',
        question: '¿Qué significa "Kamisaraki"?',
        options: ['Buenas noches', '¿Cómo estás?', 'Hasta luego', 'Estoy bien'],
        correctAnswer: '¿Cómo estás?'
    },
    {
        id: '4',
        type: 'true-false',
        question: '"Jikisiñkama" se usa para despedirse.',
        correctAnswer: 'true'
    },
    {
        id: '5',
        type: 'text-input',
        question: 'Escribe la palabra correcta para decir "Estoy bien":',
        correctAnswer: 'Waliki'
    }
];

export default function LessonView({ lessonTitle, onComplete, onClose }: LessonViewProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    const [draggedOption, setDraggedOption] = useState<string | null>(null);

    const { profile, refreshProfile } = useAuth();

    // Connect and Match State
    const [connections, setConnections] = useState<{ left: string; right: string }[]>([]);
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
    const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; color: string }[]>([]);

    // Refs for calculating positions
    const leftRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const rightRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const containerRef = useRef<HTMLDivElement | null>(null);

    const currentQuestion = SALUDOS_QUESTIONS[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === SALUDOS_QUESTIONS.length - 1;

    // Update lines whenever connections or window resize changes
    useEffect(() => {
        const updateLines = () => {
            const container = containerRef.current;
            if (!container) return;

            const newLines = connections.map(conn => {
                const leftEl = leftRefs.current[conn.left];
                const rightEl = rightRefs.current[conn.right];

                if (!leftEl || !rightEl) return null;

                const containerRect = container.getBoundingClientRect();
                const leftRect = leftEl.getBoundingClientRect();
                const rightRect = rightEl.getBoundingClientRect();

                return {
                    x1: leftRect.right - containerRect.left,
                    y1: leftRect.top + leftRect.height / 2 - containerRect.top,
                    x2: rightRect.left - containerRect.left,
                    y2: rightRect.top + rightRect.height / 2 - containerRect.top,
                    color: '#3b82f6' // Blue
                };
            }).filter(Boolean) as { x1: number; y1: number; x2: number; y2: number; color: string }[];

            setLines(newLines);
        };

        // Update immediately
        updateLines();

        // Update on resize
        window.addEventListener('resize', updateLines);
        return () => window.removeEventListener('resize', updateLines);
    }, [connections, currentQuestionIndex]); // Recalculate on question change too

    const handleAnswer = (answer: string) => {
        setSelectedAnswer(answer);
    };

    // Connect and Match Handlers
    const handleLeftClick = (left: string) => {
        if (isCorrect !== null) return;
        // If already connected, remove connection
        if (connections.some(c => c.left === left)) {
            setConnections(prev => prev.filter(c => c.left !== left));
        }
        setSelectedLeft(left);
    };

    const handleRightClick = (right: string) => {
        if (isCorrect !== null) return;
        if (selectedLeft) {
            // Remove any existing connection for this right item or the selected left item
            setConnections(prev => {
                const filtered = prev.filter(c => c.left !== selectedLeft && c.right !== right);
                return [...filtered, { left: selectedLeft, right }];
            });
            setSelectedLeft(null);
        } else {
            // If clicked right without left, maybe remove connection?
            if (connections.some(c => c.right === right)) {
                setConnections(prev => prev.filter(c => c.right !== right));
            }
        }
    };

    const handleDragStart = (option: string) => {
        setDraggedOption(option);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (draggedOption) {
            setSelectedAnswer(draggedOption);
            setDraggedOption(null);
        }
    };

    const checkAnswer = async () => {
        let correct = false;
        if (currentQuestion.type === 'matching') {
            // Check if all pairs are correct
            // Expected pairs are in currentQuestion.pairs
            if (!currentQuestion.pairs) return;

            const allCorrect = currentQuestion.pairs.every(pair => {
                const connection = connections.find(c => c.left === pair.left);
                return connection && connection.right === pair.right;
            });

            correct = allCorrect && connections.length === currentQuestion.pairs.length;
        } else if (currentQuestion.type === 'text-input') {
            if (!selectedAnswer) {
                correct = false;
            } else {
                correct = selectedAnswer.trim().toLowerCase() === (currentQuestion.correctAnswer as string).toLowerCase();
            }
        } else {
            correct = selectedAnswer === currentQuestion.correctAnswer;
        }

        setIsCorrect(correct);
        if (correct) {
            setScore(s => s + 1);
        } else {
            // Deduct life
            if (profile && profile.lives > 0) {
                const newLives = Math.max(0, profile.lives - 1);
                try {
                    await supabase
                        .from('profiles')
                        .update({ lives: newLives })
                        .eq('id', profile.id);

                    await refreshProfile();
                } catch (error) {
                    console.error('Error updating lives:', error);
                }
            }
        }
    };

    const nextQuestion = () => {
        if (isLastQuestion) {
            setShowResult(true);
        } else {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setConnections([]); // Reset connections
            setSelectedLeft(null);
            setIsCorrect(null);
            setDraggedOption(null);
        }
    };

    const handleShare = (platform: 'whatsapp' | 'twitter' | 'facebook' | 'instagram') => {
        const text = `¡Acabo de completar la lección "${lessonTitle}" en Jilata Nakateck! 🚀 He acertado ${score} de ${SALUDOS_QUESTIONS.length} preguntas.`;
        const url = window.location.href; // Or your app's landing page URL

        switch (platform) {
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
                break;
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank');
                break;
            case 'instagram':
                navigator.clipboard.writeText(text + ' ' + url).then(() => {
                    alert('¡Texto copiado! Pégalo en tu historia o publicación de Instagram.');
                });
                break;
        }
    };

    if (showResult) {
        return (
            <div className="fixed inset-0 z-[2000] bg-white flex flex-col items-center justify-center p-6">
                <div className="text-center space-y-6">
                    <h2 className="text-4xl font-bold text-gray-800">¡Lección Completada!</h2>
                    <div className="text-6xl font-bold text-green-500">{Math.round((score / SALUDOS_QUESTIONS.length) * 100)}%</div>
                    <p className="text-xl text-gray-600">Has acertado {score} de {SALUDOS_QUESTIONS.length} preguntas</p>
                    <div className="flex flex-col space-y-4 justify-center items-center">
                        <div className="flex space-x-4">
                            <button
                                onClick={onClose}
                                className="px-8 py-3 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300 transition"
                            >
                                Volver al Mapa
                            </button>
                            <button
                                onClick={() => onComplete(score)}
                                className="px-8 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition"
                            >
                                Continuar
                            </button>
                        </div>
                        <button
                            onClick={() => setShowShareModal(true)}
                            className="px-8 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition flex items-center space-x-2"
                        >
                            <Share2 className="w-5 h-5" />
                            <span>Compartir</span>
                        </button>
                    </div>
                </div>

                {/* Share Modal */}
                {showShareModal && (
                    <div className="fixed inset-0 z-[2100] bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-sm relative">
                            <button
                                onClick={() => setShowShareModal(false)}
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <h3 className="text-2xl font-bold text-center mb-6">¡Comparte tu logro!</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleShare('whatsapp')}
                                    className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition space-y-2"
                                >
                                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                                        {/* Simple WhatsApp Icon representation */}
                                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                    </div>
                                    <span className="font-semibold text-green-700">WhatsApp</span>
                                </button>

                                <button
                                    onClick={() => handleShare('facebook')}
                                    className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition space-y-2"
                                >
                                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white">
                                        {/* Simple Facebook Icon */}
                                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                    </div>
                                    <span className="font-semibold text-blue-700">Facebook</span>
                                </button>

                                <button
                                    onClick={() => handleShare('twitter')}
                                    className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition space-y-2"
                                >
                                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white">
                                        {/* X Icon */}
                                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                    </div>
                                    <span className="font-semibold text-gray-800">X</span>
                                </button>

                                <button
                                    onClick={() => handleShare('instagram')}
                                    className="flex flex-col items-center justify-center p-4 bg-pink-50 rounded-xl hover:bg-pink-100 transition space-y-2"
                                >
                                    <div className="w-12 h-12 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-full flex items-center justify-center text-white">
                                        <Copy className="w-6 h-6" />
                                    </div>
                                    <span className="font-semibold text-pink-700">Copiar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[2000] bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white px-6 py-4 shadow-sm flex items-center justify-between">
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                </button>
                <div className="flex-1 mx-8 flex flex-col justify-center">
                    <div className="text-sm font-bold text-gray-500 mb-1 text-center">{lessonTitle}</div>
                    <div className="bg-gray-200 h-3 rounded-full overflow-hidden w-full">
                        <div
                            className="bg-green-500 h-full transition-all duration-500"
                            style={{ width: `${((currentQuestionIndex) / SALUDOS_QUESTIONS.length) * 100}%` }}
                        />
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                        {[...Array(profile?.lives ?? 5)].map((_, i) => (
                            <img
                                key={i}
                                src="/sancallos/sancayoConRelleno.png"
                                alt="Life"
                                className="w-8 h-8 object-contain"
                            />
                        ))}
                    </div>
                    <div className="text-green-600 font-bold flex items-center">
                        <RefreshCw size={20} className="mr-2" />
                        {score}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full">
                <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">{currentQuestion.question}</h2>

                {currentQuestion.type === 'multiple-choice' && (
                    <div className="grid grid-cols-1 gap-4 w-full">
                        {currentQuestion.options?.map((option) => (
                            <button
                                key={option}
                                onClick={() => handleAnswer(option)}
                                disabled={isCorrect !== null}
                                className={`p-4 rounded-xl border-2 text-left font-semibold transition-all ${selectedAnswer === option
                                    ? isCorrect === null
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : isCorrect && option === currentQuestion.correctAnswer
                                            ? 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-red-500 bg-red-50 text-red-700'
                                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                )}

                {currentQuestion.type === 'completion' && (
                    <div className="w-full space-y-8">
                        <div className="flex flex-wrap gap-4 justify-center min-h-[60px]">
                            {currentQuestion.options?.map(opt => (
                                <div
                                    key={opt}
                                    draggable={isCorrect === null && selectedAnswer !== opt}
                                    onDragStart={() => handleDragStart(opt)}
                                    className={`px-6 py-3 rounded-xl font-bold text-lg shadow-sm transition-all cursor-grab active:cursor-grabbing ${selectedAnswer === opt
                                        ? 'opacity-50 bg-gray-100 text-gray-400 border-2 border-dashed border-gray-300'
                                        : 'bg-white text-blue-600 border-2 border-blue-100 hover:border-blue-300 hover:shadow-md'
                                        }`}
                                >
                                    {opt}
                                </div>
                            ))}
                        </div>

                        <div className="p-8 bg-white rounded-2xl border-2 border-gray-100 shadow-sm text-center text-2xl font-medium leading-relaxed">
                            {(() => {
                                const parts = currentQuestion.question.split('______');
                                return (
                                    <div className="flex items-center justify-center flex-wrap gap-2">
                                        <span>{parts[0]}</span>
                                        <div
                                            onDragOver={handleDragOver}
                                            onDrop={handleDrop}
                                            className={`min-w-[120px] h-12 rounded-lg border-2 flex items-center justify-center px-4 transition-all ${selectedAnswer
                                                ? isCorrect === null
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : isCorrect
                                                        ? 'border-green-500 bg-green-50 text-green-700'
                                                        : 'border-red-500 bg-red-50 text-red-700'
                                                : 'border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'
                                                }`}
                                        >
                                            {selectedAnswer || <span className="text-gray-400 text-sm">Arrastra aquí</span>}
                                        </div>
                                        <span>{parts[1]}</span>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {currentQuestion.type === 'true-false' && (
                    <div className="grid grid-cols-2 gap-4 w-full">
                        {['true', 'false'].map((val) => (
                            <button
                                key={val}
                                onClick={() => handleAnswer(val)}
                                disabled={isCorrect !== null}
                                className={`p-8 rounded-xl border-2 text-center font-bold text-xl transition-all ${selectedAnswer === val
                                    ? isCorrect === null
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : isCorrect && val === currentQuestion.correctAnswer
                                            ? 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-red-500 bg-red-50 text-red-700'
                                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                    }`}
                            >
                                {val === 'true' ? 'Verdadero' : 'Falso'}
                            </button>
                        ))}
                    </div>
                )}

                {currentQuestion.type === 'matching' && (
                    <div className="w-full relative" ref={containerRef}>
                        {/* SVG Overlay */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                            {lines.map((line, i) => (
                                <line
                                    key={i}
                                    x1={line.x1}
                                    y1={line.y1}
                                    x2={line.x2}
                                    y2={line.y2}
                                    stroke={line.color}
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                />
                            ))}
                        </svg>

                        <div className="grid grid-cols-2 gap-12">
                            <div className="space-y-6">
                                {currentQuestion.pairs?.map(pair => (
                                    <div
                                        key={pair.left}
                                        ref={el => (leftRefs.current[pair.left] = el)}
                                        onClick={() => handleLeftClick(pair.left)}
                                        className={`p-6 bg-white border-2 rounded-xl font-bold text-gray-700 cursor-pointer transition-all relative z-20 ${selectedLeft === pair.left
                                            ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
                                            : connections.some(c => c.left === pair.left)
                                                ? 'border-blue-300 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {pair.left}
                                        {/* Dot connector */}
                                        <div className="absolute right-[-6px] top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full" />
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-6">
                                {currentQuestion.pairs?.map(pair => (
                                    <div
                                        key={pair.right}
                                        ref={el => (rightRefs.current[pair.right] = el)}
                                        onClick={() => handleRightClick(pair.right)}
                                        className={`p-6 bg-white border-2 rounded-xl font-bold text-gray-700 cursor-pointer transition-all relative z-20 ${connections.some(c => c.right === pair.right)
                                            ? 'border-blue-300 bg-blue-50'
                                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {/* Dot connector */}
                                        <div className="absolute left-[-6px] top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full" />
                                        {pair.right}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {currentQuestion.type === 'text-input' && (
                    <div className="w-full max-w-md space-y-6">
                        <div className="p-8 bg-white rounded-2xl border-2 border-gray-100 shadow-sm text-center text-2xl font-medium leading-relaxed">
                            {(() => {
                                const parts = currentQuestion.question.split('______');
                                return (
                                    <div className="flex items-center justify-center flex-wrap gap-2">
                                        <span>{parts[0]}</span>
                                        <input
                                            type="text"
                                            value={selectedAnswer || ''}
                                            onChange={(e) => handleAnswer(e.target.value)}
                                            disabled={isCorrect !== null}
                                            className={`w-32 h-12 rounded-lg border-2 px-4 text-center font-bold focus:outline-none transition-all ${isCorrect === null
                                                ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                                : isCorrect
                                                    ? 'border-green-500 bg-green-50 text-green-700'
                                                    : 'border-red-500 bg-red-50 text-red-700'
                                                }`}
                                            placeholder="..."
                                        />
                                        <span>{parts[1]}</span>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className={`p-6 border-t-2 ${isCorrect === null
                ? 'border-gray-200 bg-white'
                : isCorrect
                    ? 'border-green-500 bg-green-100'
                    : 'border-red-500 bg-red-100'
                }`}>
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    {isCorrect === null ? (
                        <button
                            onClick={checkAnswer}
                            disabled={!selectedAnswer && (currentQuestion.type !== 'matching' || connections.length === 0) && currentQuestion.type !== 'text-input'}
                            className="w-full py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            Comprobar
                        </button>
                    ) : (
                        <>
                            <div className="flex items-center space-x-4">
                                <div className={`p-2 rounded-full ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                                    {isCorrect ? <Check className="text-white" /> : <X className="text-white" />}
                                </div>
                                <div>
                                    <h3 className={`font-bold text-xl ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                                        {isCorrect ? '¡Correcto!' : 'Solución correcta:'}
                                    </h3>
                                    {!isCorrect && currentQuestion.type !== 'matching' && (
                                        <p className="text-red-600">
                                            {currentQuestion.type === 'true-false'
                                                ? (currentQuestion.correctAnswer === 'true' ? 'Verdadero' : 'Falso')
                                                : currentQuestion.correctAnswer
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={nextQuestion}
                                className={`px-8 py-3 rounded-xl font-bold text-white transition ${isCorrect ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                                    }`}
                            >
                                {isLastQuestion ? 'Finalizar' : 'Continuar'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
