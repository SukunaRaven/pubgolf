import React, { useState, useEffect } from 'react';
import { Trophy, Beer, ShieldAlert, BookOpen, Users, Plus, Minus, CheckCircle, Sparkles, ChevronLeft, ChevronRight, UserCheck, RefreshCw } from 'lucide-react';
import { db } from './firebase';
import { ref, onValue, set } from 'firebase/database';

const BARS = [
  { id: 1, name: 'The Duke', drink: 'Pils naar wens', par: 4, price: 6.00 },
  { id: 2, name: 'Café de Oude Mare Poort', drink: 'Shotje', par: 1, price: 5.00 },
  { id: 3, name: 'Bar Olaf', drink: 'Frozen Pornstar Martini', par: 5, price: 11.00 },
  { id: 4, name: 'De Uil', drink: 'Kasteel Rouge', par: 5, price: 8.00 },
  { id: 5, name: '2 Spiegels', drink: '(Wit) Wijntje naar wens', par: 3, price: 7.00 },
  { id: 6, name: 'Roebels', drink: 'Zwevertje', par: 10, price: 15.00 },
  { id: 7, name: "Café 't Keizertje", drink: 'Liefmans', par: 4, price: 4.80 },
  { id: 8, name: 'Barrera', drink: 'Appeltaart shotje', par: 1, price: 4.10 },
  { id: 9, name: 'North End', drink: 'Baby Guinness', par: 1, price: 5.00 },
];

const TEAMS = [
  { id: 1, name: 'Airissa & Pjot' },
  { id: 2, name: 'Jade & Miles' },
  { id: 3, name: 'Lynn & Yess & Xander' },
  { id: 4, name: 'Zhihi & Raaf' },
];

const RULES = [
  "Het gaat echt per slok: dus niet totdat je het glas van je mond haalt!",
  "Meerdere slokken dan de gewenste Par? +1 op je score per extra slok.",
  "Hoe win je? Door als team de minste slokken/punten te behalen.",
  "Spreek vooraf goed af wie van je duo welk drankje betaalt.",
  "Spreek vooraf goed af wie welke drankjes drinkt.",
  "Foto of video verplicht als bewijs (en herinnering)! Mag in de app/groep app. Gezicht hoeft er niet op.",
  "Onder het behaalde Par gedronken? -1 bonuspunt!",
  "Precies de Par gedronken? 0 strafpunten.",
];

const PENALTIES = [
  { label: 'Morsen / Knoeien', points: 1 },
  { label: 'Foto/Video vergeten', points: 2 },
  { label: 'Valsspelen (weggooien / doorgeven)', points: 5 },
  { label: 'Drankje weigeren (per drankje)', points: 10 },
  { label: 'Tap out? (Opgegeven / Verloren)', points: 100 },
];

export default function App() {
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [activeTab, setActiveTab] = useState('tracker');
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
  const [scores, setScores] = useState({});
  const [penalties, setPenalties] = useState({});

  // 1. Luister LIVE naar Firebase wijzigingen van alle telefoons
  useEffect(() => {
    const scoresRef = ref(db, 'pubgolf/scores');
    const penaltiesRef = ref(db, 'pubgolf/penalties');

    const unsubscribeScores = onValue(scoresRef, (snapshot) => {
      if (snapshot.exists()) {
        setScores(snapshot.val());
      }
    });

    const unsubscribePenalties = onValue(penaltiesRef, (snapshot) => {
      if (snapshot.exists()) {
        setPenalties(snapshot.val());
      }
    });

    return () => {
      unsubscribeScores();
      unsubscribePenalties();
    };
  }, []);

  // 2. Schrijf de invoer van jouw eigen team direct weg naar Firebase
  const handleScoreChange = (teamId, barId, delta) => {
    const key = `${teamId}-${barId}`;
    const bar = BARS.find(b => b.id === barId);
    const current = scores[key] !== undefined ? scores[key] : bar.par;
    const nextVal = Math.max(0, current + delta);

    // Update in Firebase -> synced met alle telefoons
    set(ref(db, `pubgolf/scores/${key}`), nextVal);
  };

  const addPenalty = (teamId, points) => {
    const currentPenalties = penalties[teamId] || 0;
    set(ref(db, `pubgolf/penalties/${teamId}`), currentPenalties + points);
  };

  const getTeamStats = (teamId) => {
    let totalSlokken = 0;
    let totalPoints = 0;
    let holesCompleted = 0;

    BARS.forEach(bar => {
      const key = `${teamId}-${bar.id}`;
      if (scores[key] !== undefined) {
        const slokken = scores[key];
        totalSlokken += slokken;
        holesCompleted++;

        if (slokken < bar.par) {
          totalPoints += -1;
        } else {
          totalPoints += (slokken - bar.par);
        }
      }
    });

    const penaltyPts = penalties[teamId] || 0;
    totalPoints += penaltyPts;

    return { totalSlokken, totalPoints, holesCompleted, penaltyPts };
  };

  const sortedTeams = [...TEAMS].map(team => ({
    ...team,
    ...getTeamStats(team.id)
  })).sort((a, b) => a.totalPoints - b.totalPoints);

  const totalPrice = BARS.reduce((acc, b) => acc + b.price, 0);
  const totalPar = BARS.reduce((acc, b) => acc + b.par, 0);

  const myTeam = TEAMS.find(t => t.id === selectedTeamId);
  const currentBar = BARS[currentHoleIndex];

  // TEAM SELECTIE SCHERM
  if (!selectedTeamId) {
    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col justify-center items-center font-sans">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="space-y-2">
              <div className="inline-block p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                <Sparkles className="w-10 h-10 text-yellow-400 animate-pulse" />
              </div>
              <h1 className="text-3xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-white to-red-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]">
                PUBGOLF 2026
              </h1>
              <p className="text-sm text-blue-300 font-bold uppercase tracking-wider">Kies jouw team om te starten</p>
            </div>

            <div className="space-y-3 pt-4">
              {TEAMS.map((team) => (
                  <button
                      key={team.id}
                      onClick={() => setSelectedTeamId(team.id)}
                      className="w-full p-4 bg-blue-950/50 hover:bg-gradient-to-r hover:from-yellow-500/20 hover:to-blue-900/60 border border-blue-900/80 hover:border-yellow-500/80 rounded-2xl flex items-center justify-between text-left transition-all active:scale-95 shadow-[0_0_10px_rgba(30,58,138,0.2)]"
                  >
                    <span className="font-extrabold text-base text-white">{team.name}</span>
                    <UserCheck className="w-5 h-5 text-yellow-400" />
                  </button>
              ))}
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-slate-950 text-white pb-28 font-sans selection:bg-red-600 selection:text-white">

        {/* Header */}
        <header className="bg-gradient-to-r from-blue-900 via-blue-950 to-red-950 p-4 sticky top-0 z-50 border-b border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-yellow-500/10 rounded-xl border border-yellow-500/40 shadow-[0_0_8px_rgba(234,179,8,0.5)]">
                <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-white to-red-500">
                  PUBGOLF
                </h1>
                <span className="text-[9px] tracking-widest text-blue-300 font-bold uppercase block -mt-1">Night Out • PH</span>
              </div>
            </div>

            <button
                onClick={() => setSelectedTeamId(null)}
                className="flex items-center gap-1.5 bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 px-3 py-1 rounded-full text-xs font-black shadow-sm active:scale-95 transition"
            >
              <span>{myTeam.name}</span>
              <RefreshCw className="w-3 h-3 text-yellow-400" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-md mx-auto p-4 space-y-6">

          {/* TAB 1: SCORE INVOEREN (ALLEEN VOOR MIJN EIGEN TEAM) */}
          {activeTab === 'tracker' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2 drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]">
                    <Beer className="w-5 h-5 text-yellow-400" /> Slokken Invoeren
                  </h2>
                  <span className="text-xs text-yellow-400 font-bold bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-1 rounded-full">
                Hole {currentHoleIndex + 1} / {BARS.length}
              </span>
                </div>

                {/* Hole Card */}
                <div className="bg-blue-950/50 backdrop-blur-md rounded-2xl p-5 border border-blue-900/80 shadow-[0_0_20px_rgba(30,58,138,0.3)] space-y-6">
                  <div className="flex justify-between items-start border-b border-blue-900/60 pb-4">
                    <div>
                      <span className="text-xs font-black text-yellow-400 tracking-widest uppercase">Kroeg / Bar</span>
                      <h3 className="text-2xl font-black text-white">{currentBar.name}</h3>
                      <p className="text-base font-semibold text-blue-200 mt-0.5">{currentBar.drink}</p>
                    </div>
                    <div className="text-right">
                  <span className="inline-block bg-blue-900 text-yellow-300 border border-yellow-500/40 px-3.5 py-1 rounded-xl text-sm font-black shadow-sm">
                    Par {currentBar.par}
                  </span>
                      <div className="text-xs text-slate-400 mt-1.5 font-semibold">€ {currentBar.price.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Slokken Invoer ALLEEN VOOR JOUW TEAM */}
                  {(() => {
                    const key = `${selectedTeamId}-${currentBar.id}`;
                    const hasEnteredScore = scores[key] !== undefined;
                    const currentSlokken = hasEnteredScore ? scores[key] : currentBar.par;

                    return (
                        <div className="bg-slate-900/90 p-5 rounded-2xl border border-yellow-500/30 text-center space-y-4 shadow-inner">
                    <span className="text-xs font-extrabold text-yellow-400 uppercase tracking-widest block">
                      Jouw Slokken ({myTeam.name})
                    </span>

                          <div className="flex items-center justify-center gap-6">
                            <button
                                onClick={() => handleScoreChange(selectedTeamId, currentBar.id, -1)}
                                className="w-14 h-14 bg-blue-900/80 hover:bg-blue-800 text-white rounded-2xl flex items-center justify-center font-black active:scale-90 transition border border-blue-700/50 shadow-lg text-xl"
                            >
                              <Minus className="w-7 h-7" />
                            </button>

                            <div className="w-16 text-center">
                        <span className={`text-4xl font-black ${
                            currentSlokken < currentBar.par ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.6)]' :
                                currentSlokken > currentBar.par ? 'text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.6)]' : 'text-yellow-300'
                        }`}>
                          {currentSlokken}
                        </span>
                              <span className="block text-[10px] text-slate-400 uppercase font-bold mt-1">Slokken</span>
                            </div>

                            <button
                                onClick={() => handleScoreChange(selectedTeamId, currentBar.id, 1)}
                                className="w-14 h-14 bg-red-600 hover:bg-red-500 text-white rounded-2xl flex items-center justify-center font-black active:scale-90 transition shadow-[0_0_15px_rgba(220,38,38,0.5)] text-xl"
                            >
                              <Plus className="w-7 h-7" />
                            </button>
                          </div>

                          {!hasEnteredScore ? (
                              <button
                                  onClick={() => handleScoreChange(selectedTeamId, currentBar.id, 0)}
                                  className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition active:scale-95 shadow-[0_0_10px_rgba(234,179,8,0.4)]"
                              >
                                ✓ Bevestig Par ({currentBar.par} slokken)
                              </button>
                          ) : (
                              <div className="text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 p-2 rounded-xl">
                                ✓ Opgeslagen en live gedeeld!
                              </div>
                          )}
                        </div>
                    );
                  })()}

                  {/* Vorige / Volgende Knoppen */}
                  <div className="flex gap-3 pt-2">
                    <button
                        onClick={() => setCurrentHoleIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentHoleIndex === 0}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 border transition ${
                            currentHoleIndex === 0
                                ? 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed'
                                : 'bg-blue-900/40 border-blue-700/60 text-blue-200 hover:bg-blue-900/70 active:scale-95'
                        }`}
                    >
                      <ChevronLeft className="w-5 h-5" /> Vorige
                    </button>

                    <button
                        onClick={() => setCurrentHoleIndex(prev => Math.min(BARS.length - 1, prev + 1))}
                        disabled={currentHoleIndex === BARS.length - 1}
                        className={`flex-1 py-3 px-4 rounded-xl font-extrabold flex items-center justify-center gap-2 transition shadow-lg ${
                            currentHoleIndex === BARS.length - 1
                                ? 'bg-slate-900/40 border border-slate-800 text-slate-600 cursor-not-allowed'
                                : 'bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 hover:from-yellow-400 hover:to-amber-500 active:scale-95 shadow-[0_0_15px_rgba(234,179,8,0.4)]'
                        }`}
                    >
                      Volgende <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                </div>
              </div>
          )}

          {/* TAB 2: LIVE LEADERBOARD VAN ALLE TEAMS */}
          {activeTab === 'leaderboard' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]">
                    <Trophy className="w-5 h-5 text-yellow-400" /> Live Stand (Realtime)
                  </h2>
                  <span className="text-xs text-blue-300">Minste punten wint!</span>
                </div>

                <div className="space-y-3">
                  {sortedTeams.map((team, idx) => {
                    const isMyTeam = team.id === selectedTeamId;

                    return (
                        <div
                            key={team.id}
                            className={`p-4 rounded-xl border flex items-center justify-between transition-all backdrop-blur-md ${
                                isMyTeam
                                    ? 'bg-gradient-to-r from-yellow-500/20 to-blue-900/60 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]'
                                    : 'bg-blue-950/40 border-blue-900/60 shadow-[0_0_10px_rgba(30,58,138,0.2)]'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-md ${
                                idx === 0 ? 'bg-yellow-400 text-slate-950 shadow-[0_0_10px_rgba(234,179,8,0.8)]' :
                                    idx === 1 ? 'bg-slate-300 text-slate-950' :
                                        idx === 2 ? 'bg-amber-700 text-white' : 'bg-blue-900 text-blue-200'
                            }`}>
                              {idx + 1}
                            </div>
                            <div>
                              <h3 className="font-bold text-base text-white tracking-wide flex items-center gap-2">
                                {team.name}
                                {isMyTeam && <span className="text-[10px] bg-yellow-400 text-slate-950 px-1.5 py-0.2 rounded font-black">Jij</span>}
                              </h3>
                              <div className="flex gap-2 text-xs text-slate-300 mt-0.5">
                                <span>{team.holesCompleted}/9 holes</span>
                                <span>•</span>
                                <span>{team.totalSlokken} slokken</span>
                                {team.penaltyPts > 0 && (
                                    <span className="text-red-400 font-bold">({team.penaltyPts} straf)</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className={`text-2xl font-black ${team.totalPoints <= 0 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]'}`}>
                              {team.totalPoints > 0 ? `+${team.totalPoints}` : team.totalPoints}
                            </div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Score</span>
                          </div>
                        </div>
                    );
                  })}
                </div>
              </div>
          )}

          {/* TAB 3: BARS ROUTE */}
          {activeTab === 'bars' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]">
                  <Users className="w-5 h-5 text-yellow-400" /> Bars & Route
                </h2>

                <div className="bg-gradient-to-r from-blue-950 to-red-950 p-4 rounded-xl border border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.2)] flex justify-between items-center text-sm">
                  <div>
                    <span className="text-blue-300">Totaal verwachte Par:</span>
                    <p className="text-lg font-black text-yellow-300">{totalPar} Slokken</p>
                  </div>
                  <div className="text-right">
                    <span className="text-blue-300">Totale Prijs p.p.:</span>
                    <p className="text-lg font-black text-yellow-300">€ {totalPrice.toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {BARS.map((bar, idx) => (
                      <div
                          key={bar.id}
                          onClick={() => {
                            setCurrentHoleIndex(idx);
                            setActiveTab('tracker');
                          }}
                          className="bg-blue-950/40 hover:bg-blue-900/40 cursor-pointer backdrop-blur-md p-4 rounded-xl border border-blue-900/60 flex justify-between items-center shadow-[0_0_10px_rgba(30,58,138,0.2)] transition"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs px-2 py-0.5 rounded font-extrabold">Hole {bar.id}</span>
                            <h3 className="font-bold text-white">{bar.name}</h3>
                          </div>
                          <p className="text-sm text-blue-200">{bar.drink}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-yellow-400 font-black block drop-shadow-[0_0_6px_rgba(234,179,8,0.5)]">Par {bar.par}</span>
                          <span className="text-xs text-slate-400">€ {bar.price.toFixed(2)}</span>
                        </div>
                      </div>
                  ))}
                </div>
              </div>
          )}

          {/* TAB 4: REGELS & STRAFPUNTEN */}
          {activeTab === 'rules' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]">
                    <BookOpen className="w-5 h-5 text-yellow-400" /> Reglement
                  </h2>
                  <ul className="space-y-2">
                    {RULES.map((rule, idx) => (
                        <li key={idx} className="bg-blue-950/40 backdrop-blur-md p-3 rounded-xl border border-blue-900/60 text-sm text-blue-100 flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0 drop-shadow-[0_0_6px_rgba(234,179,8,0.6)]" />
                          <span>{rule}</span>
                        </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3 pt-4 border-t border-blue-900/60">
                  <h2 className="text-xl font-bold text-red-500 flex items-center gap-2 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                    <ShieldAlert className="w-5 h-5 text-red-500" /> Strafpunt Begaan?
                  </h2>

                  <p className="text-xs text-slate-400">Voeg een strafpunt toe voor jouw team ({myTeam.name}):</p>

                  <div className="space-y-2">
                    {PENALTIES.map((pen, idx) => (
                        <div key={idx} className="bg-red-950/30 backdrop-blur-md p-3 rounded-xl border border-red-900/60 flex justify-between items-center shadow-[0_0_10px_rgba(153,27,27,0.2)]">
                          <div>
                            <span className="text-sm font-bold text-slate-200 block">{pen.label}</span>
                            <span className="text-xs text-red-400 font-bold">+{pen.points} strafpunt(en)</span>
                          </div>
                          <button
                              onClick={() => addPenalty(selectedTeamId, pen.points)}
                              className="text-xs bg-red-600 hover:bg-red-500 text-white font-extrabold py-2 px-3 rounded-xl transition active:scale-95 shadow-[0_0_8px_rgba(220,38,38,0.5)]"
                          >
                            + Pak Straf
                          </button>
                        </div>
                    ))}
                  </div>
                </div>
              </div>
          )}

        </main>

        {/* Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-lg border-t border-yellow-500/30 shadow-[0_-5px_20px_rgba(0,0,0,0.8)] z-50">
          <div className="max-w-md mx-auto flex justify-around p-2">
            <button
                onClick={() => setActiveTab('tracker')}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${
                    activeTab === 'tracker' ? 'text-yellow-400 font-extrabold drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]' : 'text-slate-400 hover:text-blue-300'
                }`}
            >
              <Beer className="w-5 h-5" />
              <span className="text-[10px] tracking-wider uppercase">Invoeren</span>
            </button>

            <button
                onClick={() => setActiveTab('leaderboard')}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${
                    activeTab === 'leaderboard' ? 'text-yellow-400 font-extrabold drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]' : 'text-slate-400 hover:text-blue-300'
                }`}
            >
              <Trophy className="w-5 h-5" />
              <span className="text-[10px] tracking-wider uppercase">Stand</span>
            </button>

            <button
                onClick={() => setActiveTab('bars')}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${
                    activeTab === 'bars' ? 'text-yellow-400 font-extrabold drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]' : 'text-slate-400 hover:text-blue-300'
                }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] tracking-wider uppercase">Bars</span>
            </button>

            <button
                onClick={() => setActiveTab('rules')}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${
                    activeTab === 'rules' ? 'text-yellow-400 font-extrabold drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]' : 'text-slate-400 hover:text-blue-300'
                }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-[10px] tracking-wider uppercase">Regels</span>
            </button>
          </div>
        </nav>
      </div>
  );
}