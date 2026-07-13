import React, { useState } from 'react';
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
import { ChevronRight, Play, Loader2, ShieldAlert } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Dashboard() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedRound, setSelectedRound] = useState(1);
  const [selectedDriver, setSelectedDriver] = useState('VER'); // Default to VER for performance chart
  
  const { data: races, isLoading: racesLoading } = useListRaces({ year: selectedYear });
  const { data: drivers, isLoading: driversLoading } = useListDrivers({ year: selectedYear });
  
  const predictMutation = useRunPrediction();

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
            <div className="flex items-center bg-background border border-primary/50 focus-within:border-primary px-2 transition-colors">
              <ChevronRight className="w-4 h-4 opacity-50" />
              <select 
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(Number(e.target.value));
                  setSelectedRound(1); // Reset round on year change
                }}
                className="bg-background text-primary w-full p-2 focus:outline-none appearance-none"
              >
                {[2022, 2023, 2024].map(y => (
                  <option key={y} value={y}>{y} SEASON</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2 flex-1 w-full">
            <label className="text-xs opacity-70 uppercase">TARGET_GRAND_PRIX_</label>
            <div className="flex items-center bg-background border border-primary/50 focus-within:border-primary px-2 transition-colors">
              <ChevronRight className="w-4 h-4 opacity-50" />
              <select 
                value={selectedRound}
                onChange={(e) => setSelectedRound(Number(e.target.value))}
                className="bg-background text-primary w-full p-2 focus:outline-none appearance-none"
                disabled={racesLoading}
              >
                {racesLoading && <option>LOADING_RACES...</option>}
                {!racesLoading && races?.map(r => (
                  <option key={r.round} value={r.round}>R{r.round.toString().padStart(2, '0')} : {r.name.toUpperCase()}</option>
                ))}
              </select>
            </div>
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
                  {predictMutation.data.predictedWinner.teamColor && (
                    <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: predictMutation.data.predictedWinner.teamColor.startsWith('#') ? predictMutation.data.predictedWinner.teamColor : `#${predictMutation.data.predictedWinner.teamColor}` }} />
                  )}
                  <div className="text-5xl font-bold glow-text mb-2 tracking-tighter">{predictMutation.data.predictedWinner.driver}</div>
                  <div className="text-sm uppercase tracking-widest opacity-80 mb-4">{predictMutation.data.predictedWinner.team}</div>
                  <ProgressBar value={predictMutation.data.predictedWinner.confidence} label="CONFIDENCE" totalBlocks={15} className="text-sm scale-90 origin-top" />
                </div>
                
                <div className="mt-4 border border-primary/30 p-4">
                  <div className="flex items-center gap-2 mb-2 text-amber-500">
                    <ShieldAlert className="w-4 h-4" />
                    <span className="text-xs uppercase font-bold tracking-widest">STRATEGY_NOTE</span>
                  </div>
                  <div className="text-xs opacity-80 leading-relaxed font-mono">
                    {predictMutation.data.strategyNote || "NO_STRATEGY_NOTES_GENERATED"}
                  </div>
                </div>
              </div>

              {/* Podium & Overall */}
              <div className="md:w-2/3 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold uppercase">{predictMutation.data.raceName}</h2>
                    <p className="text-xs opacity-70 uppercase">R{predictMutation.data.round} // {predictMutation.data.circuit}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs opacity-70 uppercase tracking-widest">OVERALL_CONFIDENCE</span>
                    <div className="text-2xl font-bold text-[#00b4ff] glow-text">{predictMutation.data.overallConfidence}%</div>
                  </div>
                </div>

                <div className="flex items-end justify-center gap-4 h-40 border-b border-primary/30 px-4">
                  {/* P2 */}
                  {predictMutation.data.podium[1] && (
                    <div className="w-1/3 flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">
                      <div className="text-xs mb-1 opacity-70">{predictMutation.data.podium[1].confidence}%</div>
                      <div className="text-xl font-bold mb-2">{predictMutation.data.podium[1].driver}</div>
                      <div className="w-full bg-primary/40 h-20 border-t-2 border-primary flex justify-center items-end pb-2 text-2xl font-bold opacity-50">2</div>
                    </div>
                  )}
                  {/* P1 */}
                  {predictMutation.data.podium[0] && (
                    <div className="w-1/3 flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
                      <div className="text-xs mb-1 opacity-70">{predictMutation.data.podium[0].confidence}%</div>
                      <div className="text-2xl font-bold mb-2 glow-text">{predictMutation.data.podium[0].driver}</div>
                      <div className="w-full bg-primary/80 h-32 border-t-2 border-primary flex justify-center items-end pb-2 text-4xl font-bold text-background shadow-[0_0_15px_rgba(0,255,65,0.5)]">1</div>
                    </div>
                  )}
                  {/* P3 */}
                  {predictMutation.data.podium[2] && (
                    <div className="w-1/3 flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
                      <div className="text-xs mb-1 opacity-70">{predictMutation.data.podium[2].confidence}%</div>
                      <div className="text-lg font-bold mb-2">{predictMutation.data.podium[2].driver}</div>
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
                  {predictMutation.data.top10.map((entry, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs group hover:bg-primary/10 p-1 transition-colors">
                      <span className="opacity-50 w-4 font-bold text-right">{entry.position}</span>
                      <span className="font-bold w-8">{entry.driver}</span>
                      <div className="flex-1">
                        <div className="h-1.5 bg-primary/20 w-full relative">
                          <div 
                            className="h-full bg-primary absolute top-0 left-0" 
                            style={{ width: `${entry.confidence}%`, backgroundColor: entry.teamColor ? (entry.teamColor.startsWith('#') ? entry.teamColor : `#${entry.teamColor}`) : undefined }} 
                          />
                        </div>
                      </div>
                      <span className="w-8 text-right opacity-70">{entry.confidence}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Model Rationale */}
              <div className="flex flex-col gap-6">
                <div>
                  <span className="text-xs opacity-70 uppercase tracking-widest block mb-4">WHY_THIS_DRIVER_WINS</span>
                  <ul className="flex flex-col gap-2 text-sm">
                    {predictMutation.data.whyWin.map((reason, i) => (
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
                      <BarChart data={predictMutation.data.featureFactors} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="feature" type="category" stroke="rgba(0,255,65,0.7)" fontSize={10} axisLine={false} tickLine={false} />
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
        <h2 className="text-2xl font-bold uppercase tracking-widest glow-text">SEASON_ANALYTICS // {selectedYear}</h2>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Driver Performance */}
        <AnalyticsChart1 year={selectedYear} selectedDriver={selectedDriver} setSelectedDriver={setSelectedDriver} drivers={drivers || []} />
        
        {/* Chart 2: Constructors Progression */}
        <AnalyticsChart2 year={selectedYear} />
        
        {/* Chart 3: Win Percentage */}
        <AnalyticsChart3 year={selectedYear} />
        
        {/* Chart 4: Pole Positions */}
        <AnalyticsChart4 year={selectedYear} />
        
        {/* Chart 5: Circuit Performance */}
        <AnalyticsChart5 year={selectedYear} selectedDriver={selectedDriver} drivers={drivers || []} />
        
        {/* Chart 6: Avg Finish */}
        <AnalyticsChart6 year={selectedYear} />
        
      </div>
    </div>
  );
}

// Chart Components extracted for cleaner Dashboard code

function AnalyticsChart1({ year, selectedDriver, setSelectedDriver, drivers }: { year: number, selectedDriver: string, setSelectedDriver: (d: string) => void, drivers: any[] }) {
  const { data, isLoading } = useGetDriverPerformance({ year, driver: selectedDriver });
  
  return (
    <ASCIIBox title="DRIVER_PERFORMANCE_OVER_TIME">
      <div className="flex justify-between items-center mb-4 text-xs">
        <span className="opacity-70 uppercase">FINISHING_POSITION_BY_ROUND</span>
        <select 
          value={selectedDriver}
          onChange={(e) => setSelectedDriver(e.target.value)}
          className="bg-transparent border border-primary/50 text-primary p-1 focus:outline-none"
        >
          {drivers.map(d => <option key={d.code} value={d.code}>{d.code} - {d.name}</option>)}
        </select>
      </div>
      <div className="h-[250px]">
        {isLoading ? <div className="h-full flex items-center justify-center text-primary/50">LOADING...</div> : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,65,0.1)" vertical={false} />
              <XAxis dataKey="round" stroke="rgba(0,255,65,0.5)" fontSize={10} tickFormatter={(v) => `R${v}`} />
              <YAxis reversed domain={[1, 20]} stroke="rgba(0,255,65,0.5)" fontSize={10} ticks={[1, 5, 10, 15, 20]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#131313', border: '1px solid #00ff41', borderRadius: 0, fontFamily: 'monospace' }}
                labelFormatter={(v, payload) => payload.length > 0 ? `ROUND ${v}: ${payload[0].payload.raceName}` : `ROUND ${v}`}
              />
              <Line type="monotone" dataKey="position" stroke={data?.[0]?.teamColor ? (data[0].teamColor.startsWith('#') ? data[0].teamColor : `#${data[0].teamColor}`) : "#00ff41"} strokeWidth={2} dot={{ r: 3, fill: '#131313', strokeWidth: 2 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </ASCIIBox>
  );
}

function AnalyticsChart2({ year }: { year: number }) {
  const { data, isLoading } = useGetConstructorStandings({ year });
  
  // Transform data for line chart (requires restructuring from the API shape which is just totals per constructor)
  // For the sake of this visualization, since useGetConstructorStandings just returns the final standing,
  // we'll display it as a BarChart of points instead of a progression LineChart since we don't have per-round constructor points in the API schemas.
  
  return (
    <ASCIIBox title="CONSTRUCTOR_POINTS">
      <div className="mb-4 text-xs opacity-70 uppercase">TOTAL_CHAMPIONSHIP_POINTS</div>
      <div className="h-[250px]">
        {isLoading ? <div className="h-full flex items-center justify-center text-primary/50">LOADING...</div> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.slice(0, 10)} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,65,0.1)" vertical={false} />
              <XAxis dataKey="constructor" stroke="rgba(0,255,65,0.5)" fontSize={10} tick={{ fill: 'rgba(0,255,65,0.8)' }} />
              <YAxis stroke="rgba(0,255,65,0.5)" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#131313', border: '1px solid #00ff41', borderRadius: 0, fontFamily: 'monospace' }}
                cursor={{ fill: 'rgba(0,255,65,0.1)' }}
              />
              <Bar dataKey="points">
                {data?.slice(0, 10).map((entry, index) => (
                  <cell key={`cell-${index}`} fill={entry.color ? (entry.color.startsWith('#') ? entry.color : `#${entry.color}`) : "#00ff41"} />
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
        {isLoading ? <div className="h-full flex items-center justify-center text-primary/50">LOADING...</div> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.slice(0, 8)} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,65,0.1)" vertical={false} />
              <XAxis dataKey="driver" stroke="rgba(0,255,65,0.5)" fontSize={10} />
              <YAxis stroke="rgba(0,255,65,0.5)" fontSize={10} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#131313', border: '1px solid #00ff41', borderRadius: 0, fontFamily: 'monospace' }}
                formatter={(value: number) => [`${Math.round(value * 100)}%`, 'Win Rate']}
                cursor={{ fill: 'rgba(0,255,65,0.1)' }}
              />
              <Bar dataKey="winPct" fill="#00ff41">
                {data?.slice(0, 8).map((entry, index) => (
                  <cell key={`cell-${index}`} fill={entry.teamColor ? (entry.teamColor.startsWith('#') ? entry.teamColor : `#${entry.teamColor}`) : "#00ff41"} />
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
        {isLoading ? <div className="h-full flex items-center justify-center text-primary/50">LOADING...</div> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.slice(0, 8)} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,65,0.1)" vertical={false} />
              <XAxis dataKey="driver" stroke="rgba(0,255,65,0.5)" fontSize={10} />
              <YAxis stroke="rgba(0,255,65,0.5)" fontSize={10} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#131313', border: '1px solid #00ff41', borderRadius: 0, fontFamily: 'monospace' }}
                cursor={{ fill: 'rgba(0,255,65,0.1)' }}
              />
              <Bar dataKey="poles" fill="#00ff41">
                {data?.slice(0, 8).map((entry, index) => (
                  <cell key={`cell-${index}`} fill={entry.teamColor ? (entry.teamColor.startsWith('#') ? entry.teamColor : `#${entry.teamColor}`) : "#00ff41"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ASCIIBox>
  );
}

function AnalyticsChart5({ year, selectedDriver, drivers }: { year: number, selectedDriver: string, drivers: any[] }) {
  const { data, isLoading } = useGetCircuitPerformance({ year, driver: selectedDriver });
  
  return (
    <ASCIIBox title="CIRCUIT_PERFORMANCE">
      <div className="flex justify-between items-center mb-4 text-xs">
        <span className="opacity-70 uppercase">AVG_FINISH_BY_CIRCUIT</span>
        <span className="font-bold text-primary">{selectedDriver}</span>
      </div>
      <div className="h-[250px]">
        {isLoading ? <div className="h-full flex items-center justify-center text-primary/50">LOADING...</div> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.slice(0, 15)} layout="vertical" margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
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
  
  return (
    <ASCIIBox title="AVERAGE_FINISHING_POSITION">
      <div className="mb-4 text-xs opacity-70 uppercase">LOWER_IS_BETTER</div>
      <div className="h-[250px]">
        {isLoading ? <div className="h-full flex items-center justify-center text-primary/50">LOADING...</div> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.slice(0, 10).sort((a,b) => a.avgPosition - b.avgPosition)} layout="vertical" margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,65,0.1)" horizontal={false} />
              <XAxis type="number" reversed domain={[1, 20]} stroke="rgba(0,255,65,0.5)" fontSize={10} ticks={[1, 5, 10, 15, 20]} />
              <YAxis dataKey="driver" type="category" stroke="rgba(0,255,65,0.5)" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#131313', border: '1px solid #00ff41', borderRadius: 0, fontFamily: 'monospace' }}
                formatter={(value: number) => [value.toFixed(2), 'Avg Position']}
                cursor={{ fill: 'rgba(0,255,65,0.1)' }}
              />
              <Bar dataKey="avgPosition">
                {data?.slice(0, 10).sort((a,b) => a.avgPosition - b.avgPosition).map((entry, index) => (
                  <cell key={`cell-${index}`} fill={entry.teamColor ? (entry.teamColor.startsWith('#') ? entry.teamColor : `#${entry.teamColor}`) : "#00ff41"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ASCIIBox>
  );
}
