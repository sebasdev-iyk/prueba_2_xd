import { useState, useEffect, useRef } from 'react';
import { X, Check, RefreshCw, Share2, Copy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export type QuestionType = 'multiple-choice' | 'completion' | 'matching' | 'true-false' | 'text-input' | 'classification';

export interface Question {
    id: string;
    type: QuestionType;
    question: string;
    correctAnswer: string | string[]; // For matching/classification, this could be a JSON string or specific structure
    options?: string[]; // For multiple choice
    pairs?: { left: string; right: string }[]; // For matching
    categories?: string[]; // For classification
    items?: { id: string; text: string; category: string }[]; // For classification
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
        question: '¿Cuál es la respuesta correcta si alguien te dice "Kamisaraki"?',
        options: ['Jikisiñkama', 'Waliki', 'Kullaka', 'Uta'],
        correctAnswer: 'Waliki'
    },
    {
        id: '2',
        type: 'text-input',
        question: 'Para despedirte diciendo "Hasta el encuentro", escribes: ______',
        correctAnswer: 'Jikisiñkama'
    },
    {
        id: '3',
        type: 'matching',
        question: 'Une la expresión con su significado:',
        pairs: [
            { left: 'Kamisaraki', right: '¿Cómo estás?' },
            { left: 'Waliki', right: 'Bien' },
            { left: 'Yuspagara', right: 'Gracias' },
            { left: 'Aski urukipana', right: 'Buenos días' }
        ],
        correctAnswer: 'matching_check' // Placeholder, logic handles this
    },
    {
        id: '4',
        type: 'multiple-choice',
        question: '¿Qué palabra se usa para dirigirse con respeto a un "hermano" al saludar?',
        options: ['Jilata', 'Tayka', 'Uta', 'Pankara'],
        correctAnswer: 'Jilata'
    },
    {
        id: '5',
        type: 'classification',
        question: 'Clasifica si es Saludo o Despedida.',
        categories: ['Saludos', 'Despedidas'],
        items: [
            { id: 'c1', text: 'Kamisaraki', category: 'Saludos' },
            { id: 'c2', text: 'Aski urukipana', category: 'Saludos' },
            { id: 'c3', text: 'Jikisiñkama', category: 'Despedidas' },
            { id: 'c4', text: 'Qharurkama', category: 'Despedidas' }
        ],
        correctAnswer: 'classification_check' // Placeholder
    },
    {
        id: '6',
        type: 'multiple-choice',
        question: '¿Qué color es "Ch\'iyara"?',
        options: ['Negro', 'Blanco', 'Rojo', 'Verde'],
        correctAnswer: 'Negro'
    }
];

export default function LessonView({ lessonTitle, onComplete, onClose }: LessonViewProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [userPhoto, setUserPhoto] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [draggedOption, setDraggedOption] = useState<string | null>(null);

    const { profile, refreshProfile } = useAuth();

    // Connect and Match State
    const [connections, setConnections] = useState<{ left: string; right: string }[]>([]);
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
    const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; color: string }[]>([]);

    // Classification State
    const [classificationState, setClassificationState] = useState<{ [itemId: string]: string }>({});

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

    const handleDrop = (e: React.DragEvent, targetCategory?: string) => {
        e.preventDefault();
        if (draggedOption) {
            if (currentQuestion.type === 'classification' && targetCategory) {
                setClassificationState(prev => ({
                    ...prev,
                    [draggedOption]: targetCategory
                }));
            } else if (currentQuestion.type === 'completion') {
                setSelectedAnswer(draggedOption);
            }
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
        } else if (currentQuestion.type === 'classification') {
            if (!currentQuestion.items) return;
            const allCorrect = currentQuestion.items.every(item => {
                return classificationState[item.id] === item.category;
            });
            correct = allCorrect && Object.keys(classificationState).length === currentQuestion.items.length;
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
            setClassificationState({});
        }
    };

    const startCamera = async () => {
        try {
            setShowCamera(true);
            setCameraError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setCameraError("No se pudo acceder a la cámara. Por favor, verifica los permisos.");
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setShowCamera(false);
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/png');
                setUserPhoto(dataUrl);
                stopCamera();
            }
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUserPhoto(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleShare = (platform: 'whatsapp' | 'twitter' | 'facebook' | 'instagram') => {
        const userName = profile?.username || 'un estudiante';
        const text = `Soy ${userName} y he completado la lección "${lessonTitle}" en Jiwasa Aru! 🚀 He acertado ${score} de ${SALUDOS_QUESTIONS.length} preguntas.`;
        const url = window.location.href;

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

                {/* Camera Modal */}
                {showCamera && (
                    <div className="fixed inset-0 z-[2200] bg-black flex flex-col items-center justify-center">
                        <div className="relative w-full max-w-md aspect-[3/4] bg-black">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                            <canvas ref={canvasRef} className="hidden" />
                        </div>

                        {cameraError && (
                            <div className="absolute top-4 left-4 right-4 bg-red-500 text-white p-3 rounded-lg text-center">
                                {cameraError}
                            </div>
                        )}

                        <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center space-x-8">
                            <button
                                onClick={stopCamera}
                                className="px-6 py-3 bg-gray-800 text-white rounded-full font-bold"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={takePhoto}
                                className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center"
                            >
                                <div className="w-16 h-16 bg-white rounded-full border-2 border-black" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Share Modal */}
                {showShareModal && !showCamera && (
                    <div className="fixed inset-0 z-[2100] bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto relative">
                            <button
                                onClick={() => setShowShareModal(false)}
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <h3 className="text-2xl font-bold text-center mb-6">¡Comparte tu logro!</h3>

                            {/* Share Card Preview */}
                            {/* Share Card Preview */}
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 mb-6 text-white shadow-lg transform rotate-1 hover:rotate-0 transition-transform duration-300 relative overflow-hidden">
                                <div className="flex flex-row items-center gap-4">
                                    {/* Left Column: Text */}
                                    <div className="flex-1 z-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="font-bold text-lg opacity-90">Jiwasa Aru</span>
                                            <div className="bg-white/20 p-1.5 rounded-lg">
                                                <Share2 className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-indigo-100 text-sm font-medium">¡Lección Completada!</p>
                                            <p className="text-xl font-bold leading-tight">
                                                Soy {profile?.username || 'un estudiante'} y he completado {lessonTitle}
                                            </p>
                                        </div>
                                        <div className="mt-4 flex items-center space-x-2 text-xs text-indigo-200">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                            <span>Aymara Learning</span>
                                        </div>
                                    </div>

                                    {/* Right Column: Photo */}
                                    {userPhoto && (
                                        <div className="w-32 h-32 shrink-0 z-10">
                                            <img
                                                src={userPhoto}
                                                alt="User"
                                                className="w-full h-full object-cover rounded-lg border-2 border-white/30 shadow-sm"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Decorative background elements */}
                                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
                                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-blue-500/20 rounded-full blur-xl pointer-events-none"></div>
                            </div>

                            {/* Photo Actions */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <button
                                    onClick={startCamera}
                                    className="flex flex-col items-center justify-center p-3 bg-gray-100 rounded-xl cursor-pointer hover:bg-gray-200 transition"
                                >
                                    <span className="text-sm font-bold text-gray-700">Tomar Foto</span>
                                </button>
                                <label className="flex flex-col items-center justify-center p-3 bg-gray-100 rounded-xl cursor-pointer hover:bg-gray-200 transition">
                                    <span className="text-sm font-bold text-gray-700">Subir Foto</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handlePhotoUpload}
                                    />
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleShare('whatsapp')}
                                    className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition space-y-2"
                                >
                                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                    </div>
                                    <span className="font-semibold text-green-700">WhatsApp</span>
                                </button>

                                <button
                                    onClick={() => handleShare('facebook')}
                                    className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition space-y-2"
                                >
                                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white">
                                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                    </div>
                                    <span className="font-semibold text-blue-700">Facebook</span>
                                </button>

                                <button
                                    onClick={() => handleShare('twitter')}
                                    className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition space-y-2"
                                >
                                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white">
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
                                            onDrop={(e) => handleDrop(e)}
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

                {currentQuestion.type === 'classification' && (
                    <div className="w-full space-y-8">
                        <div className="text-center text-sm text-gray-500 mb-2">
                            Arrastra los elementos o haz clic para seleccionarlos y luego clic en la categoría.
                        </div>
                        {/* Draggable/Clickable Items */}
                        <div className="flex flex-wrap gap-4 justify-center min-h-[60px]">
                            {currentQuestion.items?.map(item => {
                                const isClassified = Object.keys(classificationState).includes(item.id);
                                if (isClassified) return null; // Don't show if already in a category

                                const isSelected = draggedOption === item.id;

                                return (
                                    <div
                                        key={item.id}
                                        draggable={isCorrect === null}
                                        onDragStart={() => handleDragStart(item.id)}
                                        onClick={() => isCorrect === null && setDraggedOption(isSelected ? null : item.id)}
                                        className={`px-6 py-3 border-2 rounded-xl font-bold text-lg shadow-sm cursor-pointer transition-all ${isSelected
                                            ? 'bg-blue-100 text-blue-700 border-blue-500 ring-2 ring-blue-200 scale-105'
                                            : 'bg-white text-blue-600 border-blue-100 hover:border-blue-300 hover:shadow-md'
                                            }`}
                                    >
                                        {item.text}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Categories Drop/Click Zones */}
                        <div className="grid grid-cols-2 gap-6">
                            {currentQuestion.categories?.map(category => (
                                <div
                                    key={category}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, category)}
                                    onClick={() => {
                                        if (draggedOption && currentQuestion.type === 'classification') {
                                            setClassificationState(prev => ({
                                                ...prev,
                                                [draggedOption]: category
                                            }));
                                            setDraggedOption(null);
                                        }
                                    }}
                                    className={`rounded-2xl p-6 border-2 border-dashed min-h-[200px] flex flex-col items-center transition-colors ${draggedOption
                                        ? 'border-blue-400 bg-blue-50 cursor-pointer hover:bg-blue-100'
                                        : 'border-gray-300 bg-gray-50'
                                        }`}
                                >
                                    <h3 className="text-lg font-bold text-gray-500 mb-4">{category}</h3>
                                    <div className="w-full space-y-2">
                                        {currentQuestion.items?.filter(item => classificationState[item.id] === category).map(item => (
                                            <div
                                                key={item.id}
                                                onClick={() => {
                                                    // Optional: Allow removing from category by clicking
                                                    if (isCorrect === null) {
                                                        setClassificationState(prev => {
                                                            const newState = { ...prev };
                                                            delete newState[item.id];
                                                            return newState;
                                                        });
                                                    }
                                                }}
                                                className={`px-4 py-2 rounded-lg font-bold text-center shadow-sm cursor-pointer hover:opacity-80 ${isCorrect === null
                                                    ? 'bg-white text-gray-800 border border-gray-200'
                                                    : item.category === category
                                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                                        : 'bg-red-100 text-red-700 border border-red-200'
                                                    }`}
                                            >
                                                {item.text}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
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
