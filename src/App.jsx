import { useState, useEffect } from 'react';
import { Trophy, Beer, ShieldAlert, BookOpen, Users, Plus, Minus, CheckCircle, ChevronLeft, ChevronRight, UserCheck, RefreshCw, PartyPopper } from 'lucide-react';
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

  const handleScoreChange = (teamId, barId, delta) => {
    const key = `${teamId}-${barId}`;
    const bar = BARS.find(b => b.id === barId);
    const current = scores[key] !== undefined ? scores[key] : bar.par;
    const nextVal = Math.max(0, current + delta);

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

  // SELECTION SCREEN
  if (!selectedTeamId) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 flex flex-col justify-center items-center font-sans transition-colors">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="space-y-3">
              <div className="inline-flex p-3.5 bg-fuchsia-500/10 dark:bg-fuchsia-500/20 rounded-2xl border border-fuchsia-500/30 text-fuchsia-600 dark:text-fuchsia-400">
                <PartyPopper className="w-10 h-10 animate-bounce" />
              </div>
              <h1 className="text-3xl font-black tracking-tight uppercase bg-gradient-to-r from-fuchsia-600 via-purple-600 to-amber-500 dark:from-fuchsia-400 dark:via-purple-400 dark:to-amber-300 bg-clip-text text-transparent">
                Birthday Pubgolf
              </h1>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Kies jouw team om te starten
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {TEAMS.map((team) => (
                  <button
                      key={team.id}
                      onClick={() => setSelectedTeamId(team.id)}
                      className="w-full p-4 bg-white dark:bg-slate-900 hover:bg-fuchsia-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-fuchsia-400 dark:hover:border-fuchsia-500/50 rounded-2xl flex items-center justify-between text-left transition-all active:scale-95 shadow-sm dark:shadow-none"
                  >
                    <span className="font-extrabold text-base text-slate-800 dark:text-slate-100">{team.name}</span>
                    <UserCheck className="w-5 h-5 text-fuchsia-600 dark:text-fuchsia-400" />
                  </button>
              ))}
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-28 font-sans transition-colors">

        {/* Header */}
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-fuchsia-500/10 rounded-xl border border-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400">
                <Beer className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight uppercase bg-gradient-to-r from-fuchsia-600 to-purple-600 dark:from-fuchsia-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Birthday Bash
                </h1>
                <span className="text-[10px] tracking-widest text-slate-500 dark:text-slate-400 font-bold uppercase block -mt-1">Pubgolf Edition</span>
              </div>
            </div>

            <button
                onClick={() => setSelectedTeamId(null)}
                className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-full text-xs font-bold active:scale-95 transition"
            >
              <span>{myTeam.name}</span>
              <RefreshCw className="w-3.5 h-3.5 text-fuchsia-500" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-md mx-auto p-4 space-y-6">

          {/* TAB 1: INVOEREN */}
          {activeTab === 'tracker' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Beer className="w-5 h-5 text-fuchsia-500" /> Slokken Invoeren
                  </h2>
                  <span className="text-xs font-bold text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/20 px-3 py-1 rounded-full">
                Hole {currentHoleIndex + 1} / {BARS.length}
              </span>
                </div>

                {/* Hole Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-md dark:shadow-none space-y-6">
                  <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <span className="text-xs font-black text-fuchsia-600 dark:text-fuchsia-400 tracking-widest uppercase">Kroeg / Bar</span>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">{currentBar.name}</h3>
                      <p className="text-sm font-semibold text-purple-600 dark:text-purple-300 mt-0.5">{currentBar.drink}</p>
                    </div>
                    <div className="text-right">
                  <span className="inline-block bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-xl text-sm font-black">
                    Par {currentBar.par}
                  </span>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-semibold">€ {currentBar.price.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Slokken Invoer */}
                  {(() => {
                    const key = `${selectedTeamId}-${currentBar.id}`;
                    const hasEnteredScore = scores[key] !== undefined;
                    const currentSlokken = hasEnteredScore ? scores[key] : currentBar.par;

                    return (
                        <div className="bg-slate-50 dark:bg-slate-950/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
                    <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                      Jouw Slokken ({myTeam.name})
                    </span>

                          <div className="flex items-center justify-center gap-6">
                            <button
                                onClick={() => handleScoreChange(selectedTeamId, currentBar.id, -1)}
                                className="w-14 h-14 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-2xl flex items-center justify-center font-black active:scale-90 transition border border-slate-200 dark:border-slate-700 shadow-sm text-xl"
                            >
                              <Minus className="w-6 h-6" />
                            </button>

                            <div className="w-16 text-center">
                        <span className={`text-4xl font-black ${
                            currentSlokken < currentBar.par ? 'text-emerald-500' :
                                currentSlokken > currentBar.par ? 'text-rose-500' : 'text-amber-500'
                        }`}>
                          {currentSlokken}
                        </span>
                              <span className="block text-[10px] text-slate-400 uppercase font-bold mt-1">Slokken</span>
                            </div>

                            <button
                                onClick={() => handleScoreChange(selectedTeamId, currentBar.id, 1)}
                                className="w-14 h-14 bg-fuchsia-600 text-white rounded-2xl flex items-center justify-center font-black active:scale-90 transition shadow-md shadow-fuchsia-500/20 text-xl"
                            >
                              <Plus className="w-6 h-6" />
                            </button>
                          </div>

                          {!hasEnteredScore ? (
                              <button
                                  onClick={() => handleScoreChange(selectedTeamId, currentBar.id, 0)}
                                  className="w-full py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition active:scale-95 shadow-md shadow-fuchsia-500/20"
                              >
                                ✓ Bevestig Par ({currentBar.par} slokken)
                              </button>
                          ) : (
                              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl">
                                ✓ Opgeslagen en live gedeeld!
                              </div>
                          )}
                        </div>
                    );
                  })()}

                  {/* Strafpunten per bar */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <h4 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" /> Strafpunten bij {currentBar.name}?
                    </h4>
                    <div className="space-y-2">
                      {PENALTIES.map((pen, idx) => (
                          <div key={idx} className="bg-rose-500/5 dark:bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-semibold text-slate-700 dark:text-slate-200 block">{pen.label}</span>
                              <span className="text-rose-500 font-bold">+{pen.points} pt</span>
                            </div>
                            <button
                                onClick={() => addPenalty(selectedTeamId, pen.points)}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-1.5 px-3 rounded-lg transition active:scale-95 shadow-sm"
                            >
                              + Pak Straf
                            </button>
                          </div>
                      ))}
                    </div>
                  </div>

                  {/* Vorige / Volgende Knoppen */}
                  <div className="flex gap-3 pt-2">
                    <button
                        onClick={() => setCurrentHoleIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentHoleIndex === 0}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 border transition ${
                            currentHoleIndex === 0
                                ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95'
                        }`}
                    >
                      <ChevronLeft className="w-5 h-5" /> Vorige
                    </button>

                    <button
                        onClick={() => setCurrentHoleIndex(prev => Math.min(BARS.length - 1, prev + 1))}
                        disabled={currentHoleIndex === BARS.length - 1}
                        className={`flex-1 py-3 px-4 rounded-xl font-extrabold flex items-center justify-center gap-2 transition shadow-md ${
                            currentHoleIndex === BARS.length - 1
                                ? 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                                : 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white hover:from-fuchsia-500 hover:to-purple-500 active:scale-95 shadow-fuchsia-500/20'
                        }`}
                    >
                      Volgende <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                </div>
              </div>
          )}

          {/* TAB 2: LIVE LEADERBOARD */}
          {activeTab === 'leaderboard' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" /> Live Stand (Realtime)
                  </h2>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Minste punten wint!</span>
                </div>

                <div className="space-y-3">
                  {sortedTeams.map((team, idx) => {
                    const isMyTeam = team.id === selectedTeamId;

                    return (
                        <div
                            key={team.id}
                            className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                                isMyTeam
                                    ? 'bg-gradient-to-r from-fuchsia-500/10 to-purple-500/10 dark:from-fuchsia-500/20 dark:to-purple-500/20 border-fuchsia-500/50 shadow-md'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                                idx === 0 ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30' :
                                    idx === 1 ? 'bg-slate-300 text-slate-950' :
                                        idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}>
                              {idx + 1}
                            </div>
                            <div>
                              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 tracking-wide flex items-center gap-2">
                                {team.name}
                                {isMyTeam && <span className="text-[10px] bg-fuchsia-600 text-white px-1.5 py-0.2 rounded font-black">Jij</span>}
                              </h3>
                              <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                <span>{team.holesCompleted}/9 holes</span>
                                <span>•</span>
                                <span>{team.totalSlokken} slokken</span>
                                {team.penaltyPts > 0 && (
                                    <span className="text-rose-500 font-bold">({team.penaltyPts} straf)</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className={`text-2xl font-black ${team.totalPoints <= 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
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
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-fuchsia-500" /> Bars & Route
                </h2>

                <div className="bg-gradient-to-r from-fuchsia-600 to-purple-600 p-4 rounded-2xl text-white shadow-md shadow-fuchsia-500/20 flex justify-between items-center text-sm">
                  <div>
                    <span className="text-fuchsia-100">Totaal verwachte Par:</span>
                    <p className="text-lg font-black text-amber-300">{totalPar} Slokken</p>
                  </div>
                  <div className="text-right">
                    <span className="text-fuchsia-100">Totale Prijs p.p.:</span>
                    <p className="text-lg font-black text-amber-300">€ {totalPrice.toFixed(2)}</p>
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
                          className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm dark:shadow-none transition"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/20 text-xs px-2 py-0.5 rounded-md font-extrabold">Hole {bar.id}</span>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">{bar.name}</h3>
                          </div>
                          <p className="text-sm text-purple-600 dark:text-purple-300">{bar.drink}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-amber-500 font-black block">Par {bar.par}</span>
                          <span className="text-xs text-slate-400">€ {bar.price.toFixed(2)}</span>
                        </div>
                      </div>
                  ))}
                </div>
              </div>
          )}

          {/* TAB 4: REGELS */}
          {activeTab === 'rules' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-fuchsia-500" /> Reglement
                  </h2>
                  <ul className="space-y-2">
                    {RULES.map((rule, idx) => (
                        <li key={idx} className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2.5 shadow-sm dark:shadow-none">
                          <CheckCircle className="w-4 h-4 text-fuchsia-500 mt-0.5 shrink-0" />
                          <span>{rule}</span>
                        </li>
                    ))}
                  </ul>
                </div>
              </div>
          )}

        </main>

        {/* Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-50">
          <div className="max-w-md mx-auto flex justify-around p-2">
            <button
                onClick={() => setActiveTab('tracker')}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${
                    activeTab === 'tracker' ? 'text-fuchsia-600 dark:text-fuchsia-400 font-black' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
            >
              <Beer className="w-5 h-5" />
              <span className="text-[10px] tracking-wider uppercase">Invoeren</span>
            </button>

            <button
                onClick={() => setActiveTab('leaderboard')}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${
                    activeTab === 'leaderboard' ? 'text-fuchsia-600 dark:text-fuchsia-400 font-black' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
            >
              <Trophy className="w-5 h-5" />
              <span className="text-[10px] tracking-wider uppercase">Stand</span>
            </button>

            <button
                onClick={() => setActiveTab('bars')}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${
                    activeTab === 'bars' ? 'text-fuchsia-600 dark:text-fuchsia-400 font-black' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] tracking-wider uppercase">Bars</span>
            </button>

            <button
                onClick={() => setActiveTab('rules')}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${
                    activeTab === 'rules' ? 'text-fuchsia-600 dark:text-fuchsia-400 font-black' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
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