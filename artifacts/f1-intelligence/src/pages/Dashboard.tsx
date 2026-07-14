import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  useListRaces, 
  useRunPrediction,
  useGetDriverPerformance,
  useGetConstructorStandings,
  useGetWinPercentage,
  useGetPolePositions,
  useGetCircuitPerformance,
  useGetAvgFinish,
  useListDrivers
} from '@workspace/api-client-react';
import { ASCIIBox } from '../components/ASCIIBox';
import { TerminalText } from '../components/TerminalText';
import { ProgressBar } from '../components/ProgressBar';
import { usePrediction } from '../context/PredictionContext';
import { ChevronRight, Play, Loader2, ShieldAlert } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Dashboard() {
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedRound, setSelectedRound] = useState(1);
  const [selectedDriver, setSelectedDriver] = useState('VER');
  
  const { data: races, isLoading: racesLoading } = useListRaces({ year: selectedYear });
  const { data: drivers } = useListDrivers({ year: selectedYear });
  
  const predictMutation = useRunPrediction();
  const { setPrediction } = usePrediction();

  // Sync successful prediction into shared context so Insights can read it
  useEffect(() => {
    if (predictMutation.data) {
      setPrediction(predictMutation.data as any);
    }
  }, [predictMutation.data]);

  const handlePredict = () => {
    predictMutation.mutate({ data: { year: selectedYear, round: selectedRound } });
  };

  return (
    <div className="flex flex-col gap-8 pb-16">
      
      {/* Selector Panel */}
      <ASCIIBox title="PREDICTION_ENGINE" className="border-t-4 border-t-primary">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex flex-col gap-2 flex-1 w-full">
            <label className="text-xs opacity-70 uppercase">TARGET_SEASON_</label>
            <CyberpunkSelect
              value={selectedYear}
              onChange={(v) => { setSelectedYear(Number(v)); setSelectedRound(1); }}
              options={[2022, 2023, 2024].map(y => ({ value: y, label: `${y} SEASON` }))}
            />
          </div>

          <div className="flex flex-col gap-2 flex-1 w-full">
            <label className="text-xs opacity-70 uppercase">TARGET_GRAND_PRIX_</label>
            <CyberpunkSelect
              value={selectedRound}
              onChange={(v) => setSelectedRound(Number(v))}
              disabled={racesLoading}
              options={(races as any[] || []).map((r: any) => ({
                value: r.round,
                label: `R${String(r.round).padStart(2, '0')} : ${r.name.toUpperCase()}`,
              }))}
            />
          </div>

          <button 
            onClick={handlePredict}
            disabled={predictMutation.isPending}
            className="w-full md:w-auto min-w-[200px] flex items-center justify-center gap-2 border border-primary bg-primary/20 text-primary p-2 hover:bg-primary hover:text-background transition-colors font-bold uppercase disabled:opacity-50 disabled:hover:bg-primary/20 disabled:hover:text-primary h-[42px]"
          >
            {predictMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            {predictMutation.isPending ? "COMPUTING..." : "EXECUTE"}
          </button>
        </div>
      </ASCIIBox>

      {/* Prediction Results Panel */}
      {predictMutation.isPending ? (
        <ASCIIBox title="COMPUTATION_LOG">
          <div className="h-[400px] font-mono text-sm opacity-80 flex flex-col gap-2">
            <TerminalText text="> INITIALIZING PREDICTION SEQUENCE..." delay={0} />
            <TerminalText text="> ALLOCATING TENSORS..." delay={400} />
            <TerminalText text={`> FETCHING HISTORICAL DATA FOR YEAR ${selectedYear}...`} delay={800} />
            <TerminalText text="> LOADING XGBOOST WEIGHTS..." delay={1200} />
            <TerminalText text="> RUNNING MONTE CARLO SIMULATIONS [n=10000]..." delay={1600} />
            <div className="mt-4 animate-in fade-in duration-300 delay-1500 fill-mode-both">
              <ProgressBar value={85} label="COMPUTING" />
            </div>
            <TerminalText text="> AGGREGATING CONFIDENCE SCORES..." delay={2000} />
          </div>
        </ASCIIBox>
      ) : predictMutation.data ? (
        <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">
          <ASCIIBox title="PREDICTION_OUTPUT">
            <div className="flex flex-col md:flex-row gap-8 pb-8 border-b border-primary/20">
              {/* Winner Card */}
              <div className="md:w-1/3 flex flex-col gap-2">
                <span className="text-xs opacity-70 uppercase tracking-widest">PREDICTED_WINNER</span>
                <div className="border border-primary bg-primary/10 p-6 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-primary/20 transition-colors">
                  {(predictMutation.data as any).predictedWinner?.teamColor && (
                    <div
                      className="absolute left-0 top-0 bottom-0 w-2"
                      style={{ backgroundColor: (predictMutation.data as any).predictedWinner.teamColor }}
                    />
                  )}
                  <div className="text-5xl font-bold glow-text mb-2 tracking-tighter">
                    {(predictMutation.data as any).predictedWinner?.driver}
                  </div>
                  <div className="text-sm uppercase tracking-widest opacity-80 mb-4">
                    {(predictMutation.data as any).predictedWinner?.team}
                  </div>
                  <ProgressBar
                    value={Math.round(((predictMutation.data as any).predictedWinner?.confidence ?? 0) * 100)}
                    label="CONFIDENCE"
                    totalBlocks={15}
                    className="text-sm scale-90 origin-top"
                  />
                </div>
                
                <div className="mt-4 border border-primary/30 p-4">
                  <div className="flex items-center gap-2 mb-2 text-amber-500">
                    <ShieldAlert className="w-4 h-4" />
                    <span className="text-xs uppercase font-bold tracking-widest">STRATEGY_NOTE</span>
                  </div>
                  <div className="text-xs opacity-80 leading-relaxed font-mono">
                    {(predictMutation.data as any).strategyNote || "NO_STRATEGY_NOTES_GENERATED"}
                  </div>
                </div>
              </div>

              {/* Podium & Overall */}
              <div className="md:w-2/3 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold uppercase">{(predictMutation.data as any).raceName}</h2>
                    <p className="text-xs opacity-70 uppercase">
                      R{(predictMutation.data as any).round} // {(predictMutation.data as any).circuit}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs opacity-70 uppercase tracking-widest">OVERALL_CONFIDENCE</span>
                    <div className="text-2xl font-bold text-[#00b4ff] glow-text">
                      {Math.round(((predictMutation.data as any).overallConfidence ?? 0) * 100)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-end justify-center gap-4 h-40 border-b border-primary/30 px-4">
                  {/* P2 */}
                  {(predictMutation.data as any).podium?.[1] && (
                    <div className="w-1/3 flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">
                      <div className="text-xs mb-1 opacity-70">
                        {Math.round(((predictMutation.data as any).podium[1].confidence ?? 0) * 100)}%
                      </div>
                      <div className="text-xl font-bold mb-2">{(predictMutation.data as any).podium[1].driver}</div>
                      <div className="w-full bg-primary/40 h-20 border-t-2 border-primary flex justify-center items-end pb-2 text-2xl font-bold opacity-50">2</div>
                    </div>
                  )}
                  {/* P1 */}
                  {(predictMutation.data as any).podium?.[0] && (
                    <div className="w-1/3 flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
                      <div className="text-xs mb-1 opacity-70">
                        {Math.round(((predictMutation.data as any).podium[0].confidence ?? 0) * 100)}%
                      </div>
                      <div className="text-2xl font-bold mb-2 glow-text">{(predictMutation.data as any).podium[0].driver}</div>
                      <div className="w-full bg-primary/80 h-32 border-t-2 border-primary flex justify-center items-end pb-2 text-4xl font-bold text-background shadow-[0_0_15px_rgba(0,255,65,0.5)]">1</div>
                    </div>
                  )}
                  {/* P3 */}
                  {(predictMutation.data as any).podium?.[2] && (
                    <div className="w-1/3 flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
                      <div className="text-xs mb-1 opacity-70">
                        {Math.round(((predictMutation.data as any).podium[2].confidence ?? 0) * 100)}%
                      </div>
                      <div className="text-lg font-bold mb-2">{(predictMutation.data as any).podium[2].driver}</div>
                      <div className="w-full bg-primary/20 h-12 border-t-2 border-primary flex justify-center items-end pb-2 text-xl font-bold opacity-40">3</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
              {/* Top 10 Grid */}
              <div>
                <span className="text-xs opacity-70 uppercase tracking-widest block mb-4">TOP_10_PROBABILITY</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  {(predictMutation.data as any).top10?.map((entry: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 text-xs group hover:bg-primary/10 p-1 transition-colors">
                      <span className="opacity-50 w-4 font-bold text-right">{entry.position}</span>
                      <span className="font-bold w-20 truncate">{entry.driver?.split(' ').pop()}</span>
                      <div className="flex-1">
                        <div className="h-1.5 bg-primary/20 w-full relative">
                          <div
                            className="h-full absolute top-0 left-0"
                            style={{
                              width: `${Math.round((entry.confidence ?? 0) * 100)}%`,
                              backgroundColor: entry.teamColor || 'var(--color-primary)',
                            }}
                          />
                        </div>
                      </div>
                      <span className="w-8 text-right opacity-70">{Math.round((entry.confidence ?? 0) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Model Rationale */}
              <div className="flex flex-col gap-6">
                <div>
                  <span className="text-xs opacity-70 uppercase tracking-widest block mb-4">WHY_THIS_DRIVER_WINS</span>
                  <ul className="flex flex-col gap-2 text-sm">
                    {(predictMutation.data as any).whyWin?.map((reason: string, i: number) => (
                      <li key={i} className="flex gap-2 opacity-90 border-l-2 border-primary/30 pl-3">
                        <span className="text-primary mt-[-2px]">{'>'}</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <span className="text-xs opacity-70 uppercase tracking-widest block mb-4">FEATURE_IMPORTANCE</span>
                  <div className="h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={(predictMutation.data as any).featureFactors}
                        layout="vertical"
                        margin={{ top: 0, right: 0, bottom: 0, left: -20 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="feature"
                          type="category"
                          stroke="rgba(0,255,65,0.7)"
                          fontSize={10}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#131313', border: '1px solid #00ff41', borderRadius: 0, color: '#00ff41', fontFamily: 'monospace' }}
                          itemStyle={{ color: '#00ff41' }}
                          cursor={{ fill: 'rgba(0,255,65,0.1)' }}
                        />
                        <Bar dataKey="importance" fill="#00ff41" radius={0} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </ASCIIBox>
        </div>
      ) : null}

      <div className="mt-8 border-b border-primary/30 pb-2 mb-4">
        <h2 className="text-2xl font-bold uppercase tracking-widest glow-text">
          SEASON_ANALYTICS // {selectedYear}
        </h2>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsChart1 year={selectedYear} selectedDriver={selectedDriver} setSelectedDriver={setSelectedDriver} drivers={drivers as any[] || []} />
        <AnalyticsChart2 year={selectedYear} />
        <AnalyticsChart3 year={selectedYear} />
        <AnalyticsChart4 year={selectedYear} />
        <AnalyticsChart5 year={selectedYear} selectedDriver={selectedDriver} drivers={drivers as any[] || []} />
        <AnalyticsChart6 year={selectedYear} />
      </div>
    </div>
  );
}

// ─── Monochromatic green palette — brightest first ───────────────────────────
const GREEN_SHADES = [
  '#00ff41', '#00eb3c', '#00d836', '#00c431', '#00b02b',
  '#009c26', '#008820', '#00741b', '#006015', '#004c10',
];
function greenShade(index: number): string {
  return GREEN_SHADES[Math.min(index, GREEN_SHADES.length - 1)];
}

// ─── Fully-themed cyberpunk dropdown ─────────────────────────────────────────
function CyberpunkSelect({
  value, onChange, options, disabled = false, className = '',
}: {
  value: string | number;
  onChange: (val: string) => void;
  options: { value: string | number; label: string }[];
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const selectedLabel = options.find(o => String(o.value) === String(value))?.label ?? String(value);

  const openDropdown = () => {
    if (disabled) return;
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (btnRef.current && btnRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', close);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const dropdownStyle: React.CSSProperties = rect
    ? {
        position: 'fixed',
        top: rect.bottom + 2,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      }
    : { display: 'none' };

  const listEl = open && rect ? ReactDOM.createPortal(
    <ul
      style={dropdownStyle}
      className="bg-[#0a0a0a] border border-[#00ff41] shadow-[0_0_18px_rgba(0,255,65,0.3)] max-h-64 overflow-y-auto"
    >
      {options.map(opt => (
        <li
          key={opt.value}
          onMouseDown={(e) => { e.preventDefault(); onChange(String(opt.value)); setOpen(false); }}
          className={`px-3 py-2 text-xs uppercase tracking-wide cursor-pointer transition-colors ${
            String(opt.value) === String(value)
              ? 'bg-[#00ff41]/20 text-[#00ff41]'
              : 'text-[#00ff41]/60 hover:bg-[#00ff41]/10 hover:text-[#00ff41]'
          }`}
          style={{ fontFamily: 'inherit' }}
        >
          {opt.label}
        </li>
      ))}
    </ul>,
    document.body,
  ) : null;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={openDropdown}
        className="w-full flex items-center justify-between gap-2 bg-[#0a0a0a] border border-[#00ff41] text-[#00ff41] px-3 py-2 text-xs uppercase tracking-wide focus:outline-none hover:shadow-[0_0_8px_rgba(0,255,65,0.45)] focus:shadow-[0_0_8px_rgba(0,255,65,0.45)] transition-shadow disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ fontFamily: 'inherit', borderRadius: 0 }}
      >
        <span className="truncate">{disabled ? 'LOADING...' : selectedLabel}</span>
        <ChevronRight className={`w-3 h-3 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-90' : ''}`} />
      </button>
      {listEl}
    </div>
  );
}

// ─── Chart Components ────────────────────────────────────────────────────────

function AnalyticsChart1({ year, selectedDriver, setSelectedDriver, drivers }: {
  year: number; selectedDriver: string; setSelectedDriver: (d: string) => void; drivers: any[];
}) {
  const { data, isLoading } = useGetDriverPerformance({ year, driver: selectedDriver });
  return (
    <ASCIIBox title="DRIVER_PERFORMANCE_OVER_TIME">
      <div className="flex justify-between items-center mb-4 text-xs">
        <span className="opacity-70 uppercase">FINISHING_POSITION_BY_ROUND</span>
        <CyberpunkSelect
          value={selectedDriver}
          onChange={(v) => setSelectedDriver(v)}
          options={drivers.map((d: any) => ({ value: d.code, label: `${d.code} - ${d.name}` }))}
          className="w-48"
        />
      </div>
      <div className="h-[250px]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-primary/50">LOADING...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data as any} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,65,0.1)" vertical={false} />
              <XAxis dataKey="round" stroke="rgba(0,255,65,0.5)" fontSize={10} tickFormatter={(v) => `R${v}`} />
              <YAxis reversed domain={[1, 20]} stroke="rgba(0,255,65,0.5)" fontSize={10} ticks={[1, 5, 10, 15, 20]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#131313', border: '1px solid #00ff41', borderRadius: 0, fontFamily: 'monospace' }}
                labelFormatter={(v, payload) => payload.length > 0 ? `ROUND ${v}: ${(payload[0] as any).payload.raceName}` : `ROUND ${v}`}
              />
              <Line
                type="monotone"
                dataKey="position"
                stroke={(data as any)?.[0]?.teamColor || "#00ff41"}
                strokeWidth={2}
                dot={{ r: 3, fill: '#131313', strokeWidth: 2 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </ASCIIBox>
  );
}

function AnalyticsChart2({ year }: { year: number }) {
  const { data, isLoading } = useGetConstructorStandings({ year });
  const chartData = (data as any)?.reduce((acc: any[], row: any) => {
    const existing = acc.find((r: any) => r.constructor === row.constructor);
    if (!existing) {
      // Take the last (highest) points entry per constructor
      const allForTeam = (data as any).filter((r: any) => r.constructor === row.constructor);
      const last = allForTeam[allForTeam.length - 1];
      acc.push({ constructor: row.constructor, points: last.points, color: last.color });
    }
    return acc;
  }, [])?.sort((a: any, b: any) => b.points - a.points).slice(0, 10) || [];

  return (
    <ASCIIBox title="CONSTRUCTOR_POINTS">
      <div className="mb-4 text-xs opacity-70 uppercase">TOTAL_CHAMPIONSHIP_POINTS</div>
      <div className="h-[250px]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-primary/50">LOADING...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,65,0.1)" vertical={false} />
              <XAxis dataKey="constructor" stroke="rgba(0,255,65,0.5)" fontSize={9} tick={{ fill: 'rgba(0,255,65,0.8)' }} interval={0} />
              <YAxis stroke="rgba(0,255,65,0.5)" fontSize={10} />
              <Tooltip
                contentStyle={{ backgroundColor: '#131313', border: '1px solid #00ff41', borderRadius: 0, fontFamily: 'monospace' }}
                cursor={{ fill: 'rgba(0,255,65,0.1)' }}
              />
              <Bar dataKey="points">
                {chartData.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={greenShade(index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ASCIIBox>
  );
}

function AnalyticsChart3({ year }: { year: number }) {
  const { data, isLoading } = useGetWinPercentage({ year });
  return (
    <ASCIIBox title="WIN_PERCENTAGE">
      <div className="mb-4 text-xs opacity-70 uppercase">WINS_TO_RACES_RATIO</div>
      <div className="h-[250px]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-primary/50">LOADING...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={(data as any)?.slice(0, 8)} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,65,0.1)" vertical={false} />
              <XAxis dataKey="driver" stroke="rgba(0,255,65,0.5)" fontSize={9} tickFormatter={(v) => v.split(' ').pop()} />
              <YAxis stroke="rgba(0,255,65,0.5)" fontSize={10} />
              <Tooltip
                contentStyle={{ backgroundColor: '#131313', border: '1px solid #00ff41', borderRadius: 0, fontFamily: 'monospace' }}
                cursor={{ fill: 'rgba(0,255,65,0.1)' }}
              />
              <Bar dataKey="winPct">
                {(data as any)?.slice(0, 8).map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={greenShade(index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ASCIIBox>
  );
}

function AnalyticsChart4({ year }: { year: number }) {
  const { data, isLoading } = useGetPolePositions({ year });
  return (
    <ASCIIBox title="POLE_POSITIONS">
      <div className="mb-4 text-xs opacity-70 uppercase">P1_QUALIFYING_COUNT</div>
      <div className="h-[250px]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-primary/50">LOADING...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={(data as any)?.slice(0, 8)} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,65,0.1)" vertical={false} />
              <XAxis dataKey="driver" stroke="rgba(0,255,65,0.5)" fontSize={9} tickFormatter={(v) => v.split(' ').pop()} />
              <YAxis stroke="rgba(0,255,65,0.5)" fontSize={10} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#131313', border: '1px solid #00ff41', borderRadius: 0, fontFamily: 'monospace' }}
                cursor={{ fill: 'rgba(0,255,65,0.1)' }}
              />
              <Bar dataKey="poles">
                {(data as any)?.slice(0, 8).map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={greenShade(index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ASCIIBox>
  );
}

function AnalyticsChart5({ year, selectedDriver, drivers }: {
  year: number; selectedDriver: string; drivers: any[];
}) {
  const { data, isLoading } = useGetCircuitPerformance({ year, driver: selectedDriver });
  return (
    <ASCIIBox title="CIRCUIT_PERFORMANCE">
      <div className="flex justify-between items-center mb-4 text-xs">
        <span className="opacity-70 uppercase">AVG_FINISH_BY_CIRCUIT</span>
        <span className="font-bold text-primary">{selectedDriver}</span>
      </div>
      <div className="h-[250px]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-primary/50">LOADING...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={(data as any)?.slice(0, 15)} layout="vertical" margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,65,0.1)" horizontal={false} />
              <XAxis type="number" reversed domain={[1, 20]} stroke="rgba(0,255,65,0.5)" fontSize={10} ticks={[1, 5, 10, 15, 20]} />
              <YAxis dataKey="circuit" type="category" stroke="rgba(0,255,65,0.5)" fontSize={9} width={80} tickFormatter={(v) => v.substring(0, 10)} />
              <Tooltip
                contentStyle={{ backgroundColor: '#131313', border: '1px solid #00ff41', borderRadius: 0, fontFamily: 'monospace' }}
                formatter={(value: number) => [value.toFixed(1), 'Avg Position']}
                cursor={{ fill: 'rgba(0,255,65,0.1)' }}
              />
              <Bar dataKey="avgPosition" fill="#00ff41" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ASCIIBox>
  );
}

function AnalyticsChart6({ year }: { year: number }) {
  const { data, isLoading } = useGetAvgFinish({ year });
  const sorted = [...((data as any) || [])].sort((a: any, b: any) => a.avgPosition - b.avgPosition).slice(0, 10);
  return (
    <ASCIIBox title="AVERAGE_FINISHING_POSITION">
      <div className="mb-4 text-xs opacity-70 uppercase">LOWER_IS_BETTER</div>
      <div className="h-[250px]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-primary/50">LOADING...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,65,0.1)" horizontal={false} />
              <XAxis type="number" reversed domain={[1, 20]} stroke="rgba(0,255,65,0.5)" fontSize={10} ticks={[1, 5, 10, 15, 20]} />
              <YAxis dataKey="driver" type="category" stroke="rgba(0,255,65,0.5)" fontSize={9} tickFormatter={(v) => v.split(' ').pop()} />
              <Tooltip
                contentStyle={{ backgroundColor: '#131313', border: '1px solid #00ff41', borderRadius: 0, fontFamily: 'monospace' }}
                formatter={(value: number) => [value.toFixed(2), 'Avg Position']}
                cursor={{ fill: 'rgba(0,255,65,0.1)' }}
              />
              <Bar dataKey="avgPosition">
                {sorted.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={greenShade(index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ASCIIBox>
  );
}
