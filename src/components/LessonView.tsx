import { useState, useEffect, useRef } from 'react';
import { X, Check, RefreshCw } from 'lucide-react';
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
            if (!containerRef.current) return;

            const newLines = connections.map(conn => {
                const leftEl = leftRefs.current[conn.left];
                const rightEl = rightRefs.current[conn.right];

                if (!leftEl || !rightEl) return null;

                const containerRect = containerRef.current.getBoundingClientRect();
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

    if (showResult) {
        return (
            <div className="fixed inset-0 z-[2000] bg-white flex flex-col items-center justify-center p-6">
                <div className="text-center space-y-6">
                    <h2 className="text-4xl font-bold text-gray-800">¡Lección Completada!</h2>
                    <div className="text-6xl font-bold text-green-500">{Math.round((score / SALUDOS_QUESTIONS.length) * 100)}%</div>
                    <p className="text-xl text-gray-600">Has acertado {score} de {SALUDOS_QUESTIONS.length} preguntas</p>
                    <div className="flex space-x-4 justify-center">
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
                </div>
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
                <div className="text-green-600 font-bold flex items-center">
                    <RefreshCw size={20} className="mr-2" />
                    {score}
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
