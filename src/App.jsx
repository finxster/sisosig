import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Check, Trash2, Globe, Trophy, Share2 } from 'lucide-react';

// CONFIGURE AQUI: URL do seu Worker depois do deploy
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

const translations = {
  'pt-BR': {
    title: 'DEVO FICAR\nOU DEVO IR?',
    subtitle: 'Tome decisões com clareza. Compare prós e contras.',
    newDecision: 'Nova Decisão',
    pros: 'Prós',
    cons: 'Contras',
    addPro: 'Adicionar um pró...',
    addCon: 'Adicionar um contra...',
    noDecisions: 'Nenhuma decisão ainda. Crie a primeira!',
    defaultTitle: 'Nova Decisão',
    prosCount: 'Prós',
    consCount: 'Contras',
    score: 'Pontuação',
    winner: '🏆 VENCEDOR!',
    loser: 'Perdedor',
    tie: 'Empate',
    syncing: 'Sincronizando...',
    offline: 'Offline - salvando localmente',
    shareTitle: 'COMPARTILHAR',
    shareDescription: 'Copie o link abaixo para compartilhar suas decisões:',
    copyButton: '📋 COPIAR',
    closeButton: 'FECHAR',
    copied: '✓ Link copiado!'
  },
  'en': {
    title: 'SHOULD I STAY\nOR SHOULD I GO?',
    subtitle: 'Make decisions with clarity. Compare pros & cons.',
    newDecision: 'New Decision',
    pros: 'Pros',
    cons: 'Cons',
    addPro: 'Add a pro...',
    addCon: 'Add a con...',
    noDecisions: 'No decisions yet. Create your first one!',
    defaultTitle: 'New Decision',
    prosCount: 'Pros',
    consCount: 'Cons',
    score: 'Score',
    winner: '🏆 WINNER!',
    loser: 'Loser',
    tie: 'Tie',
    syncing: 'Syncing...',
    offline: 'Offline - saving locally',
    shareTitle: 'SHARE',
    shareDescription: 'Copy the link below to share your decisions:',
    copyButton: '📋 COPY',
    closeButton: 'CLOSE',
    copied: '✓ Link copied!'
  }
};

export default function ShouldIStayOrShouldIGo() {
  const [lists, setLists] = useState([
    {
      id: '1',
      title: 'Stay',
      pros: [
        { text: 'Good job', weight: 2 },
        { text: 'Nice weather', weight: 1 }
      ],
      cons: [
        { text: 'Far from family', weight: 3 },
        { text: 'Expensive', weight: 2 }
      ]
    },
    {
      id: '2',
      title: 'Go',
      pros: [
        { text: 'Close to family', weight: 3 },
        { text: 'Lower cost', weight: 2 }
      ],
      cons: [
        { text: 'Find new job', weight: 2 },
        { text: 'Start over', weight: 1 }
      ]
    }
  ]);
  const [editingListId, setEditingListId] = useState(null);
  const [editingListTitle, setEditingListTitle] = useState('');
  const [newItemText, setNewItemText] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [language, setLanguage] = useState('en');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  const t = translations[language];
  
  // Generate or get session ID
  const [sessionId] = useState(() => {
    let id = localStorage.getItem('sessionId');
    if (!id) {
      id = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('sessionId', id);
    }
    return id;
  });
  
  const userId = sessionId;
  const shareUrl = `https://sisosig.pages.dev/${sessionId}`;

  // Detect scroll for floating bar
  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingBar(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Share function
  const handleShare = () => {
    setShowShareDialog(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 3000);
    } catch (err) {
      console.log('Failed to copy');
    }
  };

  // Calculate score for a list
  const calculateScore = (list) => {
    const prosScore = list.pros.reduce((sum, item) => sum + (item.weight || 1), 0);
    const consScore = list.cons.reduce((sum, item) => sum + (item.weight || 1), 0);
    return prosScore - consScore;
  };

  // Determine winner
  const getWinnerStatus = (listId) => {
    if (lists.length < 2) return 'neutral';
    
    const scores = lists.map(l => ({ id: l.id, score: calculateScore(l) }));
    const maxScore = Math.max(...scores.map(s => s.score));
    const winners = scores.filter(s => s.score === maxScore);
    
    if (winners.length > 1) return 'tie'; // Empate
    if (winners[0].id === listId) return 'winner';
    return 'loser';
  };

  // Load from KV or localStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Tenta carregar do KV primeiro
        const response = await fetch(`${API_URL}/lists?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setLists(data);
            // Salva no localStorage como backup
            localStorage.setItem('prosConsLists', JSON.stringify(data));
          }
          setIsOnline(true);
        }
      } catch (error) {
        console.log('KV unavailable, using localStorage', error);
        setIsOnline(false);
        // Fallback para localStorage
        const saved = localStorage.getItem('prosConsLists');
        if (saved) {
          setLists(JSON.parse(saved));
        }
      }

      // Carrega preferência de idioma
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage) {
        setLanguage(savedLanguage);
      }
    };

    loadData();
  }, []);

  // Save to KV and localStorage
  useEffect(() => {
    const saveData = async () => {
      // Sempre salva no localStorage primeiro
      localStorage.setItem('prosConsLists', JSON.stringify(lists));

      // Tenta salvar no KV
      if (lists.length > 0) {
        setIsSyncing(true);
        try {
          const response = await fetch(`${API_URL}/lists`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, lists })
          });
          
          if (response.ok) {
            setIsOnline(true);
          }
        } catch (error) {
          console.log('Failed to sync to KV', error);
          setIsOnline(false);
        } finally {
          setIsSyncing(false);
        }
      }
    };

    // Debounce para não salvar a cada keystroke
    const timeoutId = setTimeout(saveData, 500);
    return () => clearTimeout(timeoutId);
  }, [lists]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => setLanguage(language === 'en' ? 'pt-BR' : 'en');

  const addList = () => {
    const newList = {
      id: Date.now().toString(),
      title: t.defaultTitle,
      pros: [],
      cons: []
    };
    setLists([...lists, newList]);
    setEditingListId(newList.id);
    setEditingListTitle(newList.title);
  };

  const deleteList = (listId) => {
    setLists(lists.filter(l => l.id !== listId));
  };

  const startEditingList = (list) => {
    setEditingListId(list.id);
    setEditingListTitle(list.title);
  };

  const saveListTitle = (listId) => {
    setLists(lists.map(l => 
      l.id === listId ? { ...l, title: editingListTitle } : l
    ));
    setEditingListId(null);
  };

  const addItem = (listId, type) => {
    const text = newItemText[`${listId}-${type}`];
    if (!text?.trim()) return;

    setLists(lists.map(l => {
      if (l.id === listId) {
        return {
          ...l,
          [type]: [...l[type], { text: text.trim(), weight: 1 }]
        };
      }
      return l;
    }));

    setNewItemText({ ...newItemText, [`${listId}-${type}`]: '' });
  };

  const deleteItem = (listId, type, index) => {
    setLists(lists.map(l => {
      if (l.id === listId) {
        return {
          ...l,
          [type]: l[type].filter((_, i) => i !== index)
        };
      }
      return l;
    }));
  };

  const updateWeight = (listId, type, index, newWeight) => {
    setLists(lists.map(l => {
      if (l.id === listId) {
        const newArray = [...l[type]];
        newArray[index] = { ...newArray[index], weight: newWeight };
        return { ...l, [type]: newArray };
      }
      return l;
    }));
  };

  const startEditingItem = (listId, type, index, item) => {
    setEditingItem({ listId, type, index, text: item.text, weight: item.weight });
  };

  const saveEditingItem = () => {
    if (!editingItem?.text.trim()) return;

    setLists(lists.map(l => {
      if (l.id === editingItem.listId) {
        const newArray = [...l[editingItem.type]];
        newArray[editingItem.index] = { 
          text: editingItem.text.trim(), 
          weight: editingItem.weight 
        };
        return { ...l, [editingItem.type]: newArray };
      }
      return l;
    }));

    setEditingItem(null);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-gray-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Archivo+Black&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          overflow-x: hidden;
        }

        .header-gradient {
          background: #fbbf24;
          border-bottom: 6px solid #000;
        }

        .list-card {
          background: #fef3c7;
          border: 5px solid #000;
          transition: all 0.15s ease;
          box-shadow: 8px 8px 0px 0px #000;
        }

        .list-card:hover {
          transform: translate(-2px, -2px);
          box-shadow: 12px 12px 0px 0px #000;
        }

        .list-card-winner {
          background: #fef3c7;
          border: 6px solid #22c55e;
          animation: winnerPulse 2s ease-in-out infinite;
          box-shadow: 8px 8px 0px 0px #22c55e, 0 0 30px rgba(34, 197, 94, 0.3);
        }

        .list-card-winner:hover {
          transform: translate(-2px, -2px);
          box-shadow: 12px 12px 0px 0px #22c55e, 0 0 40px rgba(34, 197, 94, 0.4);
        }

        .list-card-loser {
          background: #fef3c7;
          border: 5px solid #ef4444;
          opacity: 0.85;
          box-shadow: 8px 8px 0px 0px #ef4444;
        }

        .list-card-loser:hover {
          transform: translate(-2px, -2px);
          box-shadow: 12px 12px 0px 0px #ef4444;
        }

        @keyframes winnerPulse {
          0%, 100% { 
            box-shadow: 8px 8px 0px 0px #22c55e, 0 0 30px rgba(34, 197, 94, 0.3);
          }
          50% { 
            box-shadow: 8px 8px 0px 0px #22c55e, 0 0 50px rgba(34, 197, 94, 0.6);
          }
        }

        .pro-item {
          background: #22c55e;
          border: 3px solid #000;
          transition: all 0.15s ease;
          box-shadow: 3px 3px 0px 0px #000;
        }

        .pro-item:hover {
          transform: translate(-2px, -2px);
          box-shadow: 5px 5px 0px 0px #000;
        }

        .con-item {
          background: #ef4444;
          border: 3px solid #000;
          transition: all 0.15s ease;
          box-shadow: 3px 3px 0px 0px #000;
        }

        .con-item:hover {
          transform: translate(-2px, -2px);
          box-shadow: 5px 5px 0px 0px #000;
        }

        .input-modern {
          background: white;
          border: 3px solid #000;
          transition: all 0.15s ease;
          color: #000;
          box-shadow: 3px 3px 0px 0px #000;
        }

        .input-modern:focus {
          outline: none;
          transform: translate(-2px, -2px);
          box-shadow: 5px 5px 0px 0px #000;
        }

        .btn-primary {
          background: #fbbf24;
          transition: all 0.15s ease;
          color: #000;
          border: 4px solid #000;
          box-shadow: 4px 4px 0px 0px #000;
        }

        .btn-primary:hover {
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0px 0px #000;
        }

        .btn-primary:active {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0px 0px #000;
        }

        .weight-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          border: 3px solid #000;
          transition: all 0.15s ease;
          background: white;
          cursor: pointer;
        }

        .weight-btn:hover {
          transform: scale(1.1);
        }

        .weight-btn.active {
          background: #fbbf24;
          transform: scale(1.15);
        }

        .icon-btn {
          transition: all 0.15s ease;
          border: 3px solid transparent;
        }

        .icon-btn:hover {
          border-color: #000;
          background: #fbbf24;
        }

        .icon-btn:active {
          transform: scale(0.95);
        }

        .winner-badge {
          background: #22c55e;
          border: 4px solid #000;
          box-shadow: 4px 4px 0px 0px #000;
          animation: badgeBounce 1s ease-in-out infinite;
        }

        @keyframes badgeBounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }

        .loser-badge {
          background: #ef4444;
          border: 3px solid #000;
          opacity: 0.7;
        }

        .fade-in {
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }

        .title-font {
          font-family: 'Archivo Black', sans-serif;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .body-font {
          font-family: 'Space Mono', monospace;
        }

        .status-badge {
          font-size: 0.75rem;
          padding: 4px 8px;
          border: 2px solid #000;
          background: white;
        }

        @media (max-width: 768px) {
          .header-title {
            font-size: 2rem;
          }
        }
      `}</style>

      {/* Header */}
      <header className="header-gradient py-6 md:py-12 px-4 md:px-6 mb-6 md:mb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between mb-2 md:mb-4">
            <div className="flex-1">
              <h1 className="title-font text-4xl md:text-5xl lg:text-7xl font-bold text-black mb-1 md:mb-2">
                SISOSIG?
              </h1>
              <p className="body-font text-xs md:text-sm lg:text-base font-bold text-black/70 uppercase tracking-wide">
                Should I Stay Or Should I Go?
              </p>
            </div>
            <div className="flex gap-2 md:gap-3 items-start ml-4">
              <button
                onClick={handleShare}
                className="p-2 md:p-3 bg-white border-3 md:border-4 border-black transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] shadow-[3px_3px_0px_0px_#000] md:shadow-[4px_4px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] md:hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000]"
                title="Share"
              >
                <Share2 size={16} className="text-black md:w-5 md:h-5" />
              </button>
              
              <button
                onClick={toggleLanguage}
                className="p-2 md:p-3 bg-white border-3 md:border-4 border-black transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] shadow-[3px_3px_0px_0px_#000] md:shadow-[4px_4px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] md:hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000]"
                title={language === 'en' ? 'Português' : 'English'}
              >
                <Globe size={16} className="text-black md:w-5 md:h-5" />
              </button>
            </div>
          </div>
          <p className="body-font text-sm md:text-lg lg:text-xl font-bold text-black uppercase tracking-wide hidden md:block">
            {t.subtitle}
          </p>
        </div>
      </header>

      {/* Floating Bar (appears on scroll) */}
      {showFloatingBar && lists.length > 0 && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#fbbf24] border-b-4 border-black py-3 px-4 shadow-lg animate-slideDown">
          <div className="max-w-6xl mx-auto flex items-center gap-3 overflow-x-auto">
            {lists.map((list) => {
              const status = getWinnerStatus(list.id);
              const score = calculateScore(list);
              const isWinner = status === 'winner';
              
              return (
                <div
                  key={list.id}
                  className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 border-3 border-black ${
                    isWinner ? 'bg-green-400' : 'bg-white'
                  }`}
                >
                  {isWinner && <span className="text-lg">🏆</span>}
                  <div>
                    <div className="body-font font-bold text-xs text-black truncate max-w-[120px]">
                      {list.title}
                    </div>
                    <div className={`title-font font-bold text-sm ${
                      score > 0 ? 'text-green-700' : score < 0 ? 'text-red-700' : 'text-gray-700'
                    }`}>
                      {score > 0 ? '+' : ''}{score}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Share Dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowShareDialog(false)}>
          <div className="bg-[#fef3c7] border-5 border-black p-6 max-w-md w-full shadow-[12px_12px_0px_0px_#000]" onClick={(e) => e.stopPropagation()}>
            <h3 className="title-font text-2xl font-bold mb-4 text-black">
              {t.shareTitle}
            </h3>
            <p className="body-font text-sm mb-4 text-black">
              {t.shareDescription}
            </p>
            <div className="mb-4">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="w-full px-4 py-3 border-3 border-black body-font text-sm bg-white"
                onClick={(e) => e.target.select()}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={copyToClipboard}
                className="flex-1 btn-primary px-4 py-3 font-bold uppercase tracking-wide text-sm body-font"
              >
                {t.copyButton}
              </button>
              <button
                onClick={() => setShowShareDialog(false)}
                className="flex-1 bg-white border-4 border-black px-4 py-3 font-bold uppercase tracking-wide text-sm body-font transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000]"
              >
                {t.closeButton}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showCopiedToast && (
        <div className="fixed top-4 right-4 z-[60] bg-green-400 border-4 border-black px-6 py-3 shadow-[6px_6px_0px_0px_#000] animate-slideDown">
          <p className="body-font font-bold text-black">
            {t.copied}
          </p>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 pb-8 md:pb-12 body-font">
        {/* Add New List Button */}
        <div className="mb-6 md:mb-8 pt-4 md:pt-8">
          <button
            onClick={addList}
            className="btn-primary px-4 md:px-6 py-2 md:py-3 font-bold uppercase tracking-wide flex items-center gap-2 text-sm md:text-base"
          >
            <Plus size={18} className="md:w-5 md:h-5" />
            {t.newDecision}
          </button>
        </div>

        {/* Lists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {lists.map((list, idx) => {
            const status = getWinnerStatus(list.id);
            const score = calculateScore(list);
            const cardClass = status === 'winner' 
              ? 'list-card-winner' 
              : status === 'loser' 
              ? 'list-card-loser' 
              : 'list-card';

            return (
              <div
                key={list.id}
                className={`${cardClass} p-4 md:p-6 fade-in`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {/* Status Badge */}
                {status === 'winner' && (
                  <div className="winner-badge px-3 md:px-4 py-1 md:py-2 mb-3 md:mb-4 text-center">
                    <span className="title-font text-base md:text-lg text-black">
                      {t.winner}
                    </span>
                  </div>
                )}
                {status === 'loser' && (
                  <div className="loser-badge px-3 md:px-4 py-1 md:py-2 mb-3 md:mb-4 text-center">
                    <span className="title-font text-xs md:text-sm text-white">
                      {t.loser}
                    </span>
                  </div>
                )}

                {/* List Header */}
                <div className="mb-4 md:mb-6">
                  {editingListId === list.id ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={editingListTitle}
                        onChange={(e) => setEditingListTitle(e.target.value)}
                        className="input-modern px-3 py-2 text-lg md:text-xl font-bold min-w-0 flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveListTitle(list.id);
                          if (e.key === 'Escape') setEditingListId(null);
                        }}
                      />
                      <button
                        onClick={() => saveListTitle(list.id)}
                        className="icon-btn p-2"
                      >
                        <Check size={18} className="text-black" />
                      </button>
                      <button
                        onClick={() => setEditingListId(null)}
                        className="icon-btn p-2"
                      >
                        <X size={18} className="text-black" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2 w-full">
                      <h2 className="title-font text-xl md:text-2xl font-bold text-black break-words min-w-0 flex-1">
                        {list.title}
                      </h2>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditingList(list)}
                          className="icon-btn p-2"
                        >
                          <Edit2 size={16} className="text-black" />
                        </button>
                        <button
                          onClick={() => deleteList(list.id)}
                          className="icon-btn p-2"
                        >
                          <Trash2 size={16} className="text-black" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Score Display */}
                <div className="mb-4 md:mb-6 p-3 md:p-4 bg-white border-3 md:border-4 border-black text-center">
                  <div className="title-font text-xs md:text-sm mb-1">{t.score}</div>
                  <div className={`title-font text-3xl md:text-4xl font-bold ${
                    score > 0 ? 'text-green-600' : score < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {score > 0 ? '+' : ''}{score}
                  </div>
                </div>

                {/* Pros & Cons Container */}
                <div className="grid grid-cols-1 gap-4 md:gap-6">
                  {/* PROS */}
                  <div>
                    <h3 className="title-font text-base md:text-lg font-bold mb-2 md:mb-3 uppercase tracking-wider border-b-3 md:border-b-4 border-black pb-1 md:pb-2 text-black">
                      ✓ {t.pros}
                    </h3>
                    <div className="space-y-2 md:space-y-3 mb-2 md:mb-3">
                      {list.pros.map((pro, proIdx) => (
                        <div key={proIdx} className="pro-item p-3 group">
                          {editingItem?.listId === list.id && 
                           editingItem?.type === 'pros' && 
                           editingItem?.index === proIdx ? (
                            <div className="flex flex-col gap-2">
                              <input
                                type="text"
                                value={editingItem.text}
                                onChange={(e) => setEditingItem({ ...editingItem, text: e.target.value })}
                                className="input-modern flex-1 px-3 py-1 text-sm font-bold"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditingItem();
                                  if (e.key === 'Escape') setEditingItem(null);
                                }}
                              />
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold">Peso:</span>
                                {[1, 2, 3, 5].map(w => (
                                  <button
                                    key={w}
                                    onClick={() => setEditingItem({ ...editingItem, weight: w })}
                                    className={`weight-btn ${editingItem.weight === w ? 'active' : ''}`}
                                  >
                                    {w}
                                  </button>
                                ))}
                                <button
                                  onClick={saveEditingItem}
                                  className="icon-btn p-1 ml-auto"
                                >
                                  <Check size={16} className="text-black" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2">
                              <div className="flex-1">
                                <span className="text-sm font-bold text-black block">{pro.text}</span>
                                <div className="flex gap-1 mt-1">
                                  {[1, 2, 3, 5].map(w => (
                                    <button
                                      key={w}
                                      onClick={() => updateWeight(list.id, 'pros', proIdx, w)}
                                      className={`weight-btn ${pro.weight === w ? 'active' : ''}`}
                                    >
                                      {w}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => startEditingItem(list.id, 'pros', proIdx, pro)}
                                  className="icon-btn p-1"
                                >
                                  <Edit2 size={14} className="text-black" />
                                </button>
                                <button
                                  onClick={() => deleteItem(list.id, 'pros', proIdx)}
                                  className="icon-btn p-1"
                                >
                                  <X size={14} className="text-black" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={t.addPro}
                        value={newItemText[`${list.id}-pros`] || ''}
                        onChange={(e) => setNewItemText({ 
                          ...newItemText, 
                          [`${list.id}-pros`]: e.target.value 
                        })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') addItem(list.id, 'pros');
                        }}
                        className="input-modern flex-1 px-3 py-2 text-sm font-bold"
                      />
                      <button
                        onClick={() => addItem(list.id, 'pros')}
                        className="p-2 bg-green-400 border-4 border-black transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] shadow-[3px_3px_0px_0px_#000] hover:shadow-[5px_5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_#000]"
                      >
                        <Plus size={18} className="text-black" />
                      </button>
                    </div>
                  </div>

                  {/* CONS */}
                  <div>
                    <h3 className="title-font text-base md:text-lg font-bold mb-2 md:mb-3 uppercase tracking-wider border-b-3 md:border-b-4 border-black pb-1 md:pb-2 text-black">
                      ✗ {t.cons}
                    </h3>
                    <div className="space-y-2 md:space-y-3 mb-2 md:mb-3">
                      {list.cons.map((con, conIdx) => (
                        <div key={conIdx} className="con-item p-3 group">
                          {editingItem?.listId === list.id && 
                           editingItem?.type === 'cons' && 
                           editingItem?.index === conIdx ? (
                            <div className="flex flex-col gap-2">
                              <input
                                type="text"
                                value={editingItem.text}
                                onChange={(e) => setEditingItem({ ...editingItem, text: e.target.value })}
                                className="input-modern flex-1 px-3 py-1 text-sm font-bold"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditingItem();
                                  if (e.key === 'Escape') setEditingItem(null);
                                }}
                              />
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold">Peso:</span>
                                {[1, 2, 3, 5].map(w => (
                                  <button
                                    key={w}
                                    onClick={() => setEditingItem({ ...editingItem, weight: w })}
                                    className={`weight-btn ${editingItem.weight === w ? 'active' : ''}`}
                                  >
                                    {w}
                                  </button>
                                ))}
                                <button
                                  onClick={saveEditingItem}
                                  className="icon-btn p-1 ml-auto"
                                >
                                  <Check size={16} className="text-black" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2">
                              <div className="flex-1">
                                <span className="text-sm font-bold text-black block">{con.text}</span>
                                <div className="flex gap-1 mt-1">
                                  {[1, 2, 3, 5].map(w => (
                                    <button
                                      key={w}
                                      onClick={() => updateWeight(list.id, 'cons', conIdx, w)}
                                      className={`weight-btn ${con.weight === w ? 'active' : ''}`}
                                    >
                                      {w}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => startEditingItem(list.id, 'cons', conIdx, con)}
                                  className="icon-btn p-1"
                                >
                                  <Edit2 size={14} className="text-black" />
                                </button>
                                <button
                                  onClick={() => deleteItem(list.id, 'cons', conIdx)}
                                  className="icon-btn p-1"
                                >
                                  <X size={14} className="text-black" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={t.addCon}
                        value={newItemText[`${list.id}-cons`] || ''}
                        onChange={(e) => setNewItemText({ 
                          ...newItemText, 
                          [`${list.id}-cons`]: e.target.value 
                        })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') addItem(list.id, 'cons');
                        }}
                        className="input-modern flex-1 px-3 py-2 text-sm font-bold"
                      />
                      <button
                        onClick={() => addItem(list.id, 'cons')}
                        className="p-2 bg-red-400 border-4 border-black transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] shadow-[3px_3px_0px_0px_#000] hover:shadow-[5px_5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_#000]"
                      >
                        <Plus size={18} className="text-black" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Decision Score Summary */}
                <div className="mt-6 pt-6 border-t-4 border-black">
                  <div className="flex items-center justify-between text-sm font-bold uppercase">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-400 border-2 border-black"></div>
                      <span className="text-black">
                        {list.pros.length} {t.prosCount} ({list.pros.reduce((sum, p) => sum + p.weight, 0)} pts)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-black">
                        {list.cons.length} {t.consCount} ({list.cons.reduce((sum, c) => sum + c.weight, 0)} pts)
                      </span>
                      <div className="w-4 h-4 bg-red-400 border-2 border-black"></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {lists.length === 0 && (
          <div className="text-center py-20">
            <p className="text-lg font-bold uppercase text-black">
              {t.noDecisions}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}