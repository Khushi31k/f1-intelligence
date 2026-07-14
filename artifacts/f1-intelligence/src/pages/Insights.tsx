import React from 'react';
import { useGetDriverStandings } from '@workspace/api-client-react';
import { ASCIIBox } from '../components/ASCIIBox';
import { TerminalText } from '../components/TerminalText';
import { Cpu, Binary, Target, Zap, Clock, Box, Layers } from 'lucide-react';
import { usePrediction } from '../context/PredictionContext';

export default function Insights() {
  const currentYear = new Date().getFullYear();
  const { data: standings, isLoading: standingsLoading } = useGetDriverStandings({ year: currentYear });
  const { prediction } = usePrediction();

  const features = [
    { name: "QUALIFYING_POSITION", icon: Target, desc: "Grid starting position is the strongest predictor. Weights heavily on tight street circuits like Monaco.", importance: 92 },
    { name: "CONSTRUCTOR_PACE", icon: Zap, desc: "Aggregated delta to fastest lap across recent sessions. Neutralizes driver skill to isolate car performance.", importance: 85 },
    { name: "DRIVER_CONSISTENCY", icon: Binary, desc: "Variance in lap times over long stints. Identifies drivers able to manage tire degradation effectively.", importance: 78 },
    { name: "CIRCUIT_ADAPTABILITY", icon: Box, desc: "Historical performance delta at similar circuit types (high downforce, high speed, street).", importance: 65 },
    { name: "RECENT_FORM", icon: Clock, desc: "Exponential moving average of finishing positions over the last 5 races.", importance: 60 },
    { name: "TEAM_STRATEGY_INDEX", icon: Layers, desc: "Historical success rate of team pit calls under safety car and changing weather conditions.", importance: 45 },
  ];

  const maxPoints = standings && standings.length > 0
    ? Math.max(...(standings as any[]).map((s: any) => s.points))
    : 1;

  return (
    <div className="flex flex-col gap-8 pb-16">
      <div className="border-b border-primary/30 pb-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-widest glow-text uppercase mb-2">ML INSIGHTS</h1>
        <p className="text-primary/60 text-sm uppercase tracking-widest">XGBOOST RACE PREDICTOR ARCHITECTURE</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Theory & Features — spans 2 cols */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          <ASCIIBox title="THEORETICAL_FRAMEWORK">
            <div className="flex flex-col gap-4 text-sm leading-relaxed opacity-90">
              <p>
                <span className="text-primary font-bold">XGBoost (eXtreme Gradient Boosting)</span> is an
                optimized distributed gradient boosting library designed to be highly efficient, flexible and portable.
              </p>
              <p>
                In Formula 1, predicting a race winner is a regression problem with high dimensionality and complex
                feature interactions. A driver&apos;s raw pace matters, but so does their grid position, the circuit
                characteristics, and the historical reliability of their machinery.
              </p>
              <p>
                Our model utilizes decision tree ensembles to capture these non-linear relationships. For instance,
                the interaction between &quot;Grid Position &gt; 5&quot; and &quot;Circuit Type = Street&quot; heavily
                penalizes win probability in a way that linear models struggle to represent.
              </p>
              
              <div className="mt-4 p-4 border border-primary/20 bg-primary/5 grid grid-cols-3 gap-4 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="opacity-50">TRAINING_VECTORS</span>
                  <span className="font-mono text-lg font-bold">~1,200+</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="opacity-50">CROSS_VALIDATION</span>
                  <span className="font-mono text-lg font-bold">80/20 SPLIT</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="opacity-50">ACCURACY_PROXY</span>
                  <span className="font-mono text-lg font-bold text-primary">±3 POSITIONS</span>
                </div>
              </div>
            </div>
          </ASCIIBox>

          <div>
            <h2 className="text-xl font-bold uppercase tracking-widest mb-4 glow-text">FEATURE_VECTORS</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="border border-primary/30 bg-background/50 p-4 hover:border-primary transition-colors flex flex-col gap-3 group"
                >
                  <div className="flex items-center gap-2 border-b border-primary/20 pb-2">
                    <f.icon className="w-4 h-4 text-primary group-hover:animate-pulse flex-shrink-0" />
                    <span className="font-bold text-sm tracking-wider">{f.name}</span>
                  </div>
                  <p className="text-xs opacity-70 flex-1">{f.desc}</p>
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-[10px] opacity-50 w-10 flex-shrink-0">WEIGHT</span>
                    <div className="flex-1 h-1 bg-primary/20">
                      <div className="h-full bg-primary" style={{ width: `${f.importance}%` }} />
                    </div>
                    <span className="text-[10px] opacity-50 w-8 text-right">{f.importance}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          
          {/* Applied Example — synced from Dashboard via context */}
          <ASCIIBox title="APPLIED_EXAMPLE">
            <div className="text-xs opacity-70 mb-3 border-b border-primary/20 pb-2">
              Updated after each Dashboard prediction.
            </div>
            
            <div className="flex flex-col gap-4 min-h-[220px]">
              {prediction ? (
                <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                  {/* Race header */}
                  <div className="flex flex-col gap-1 border-b border-primary/20 pb-3">
                    <span className="text-xs uppercase opacity-50">RACE</span>
                    <span className="text-sm font-bold">{prediction.raceName}</span>
                    <span className="text-xs opacity-40">R{prediction.round} // {prediction.circuit}</span>
                  </div>

                  {/* Predicted winner */}
                  <div className="flex items-center justify-between border border-primary/20 bg-primary/5 p-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] uppercase opacity-50">PREDICTED_WINNER</span>
                      <span className="text-base font-bold glow-text">{prediction.predictedWinner?.driver}</span>
                      <span className="text-xs opacity-60">{prediction.predictedWinner?.team}</span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-[10px] uppercase opacity-50">CONFIDENCE</span>
                      <span className="text-xl font-bold text-primary">
                        {Math.round((prediction.predictedWinner?.confidence ?? 0) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Top features */}
                  {prediction.featureFactors && prediction.featureFactors.length > 0 && (
                    <div>
                      <span className="text-[10px] uppercase opacity-50 block mb-2">TOP_CONTRIBUTING_FEATURES</span>
                      <div className="flex flex-col gap-1.5">
                        {prediction.featureFactors.slice(0, 4).map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="opacity-40 w-3">{i + 1}.</span>
                            <span className="flex-1 opacity-80 truncate">{f.feature}</span>
                            <div className="w-16 h-1 bg-primary/20 flex-shrink-0">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${Math.round(f.importance * 100)}%` }}
                              />
                            </div>
                            <span className="opacity-50 w-8 text-right">{Math.round(f.importance * 100)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Why win */}
                  {prediction.whyWin && prediction.whyWin.length > 0 && (
                    <div>
                      <span className="text-[10px] uppercase opacity-50 block mb-2">MODEL_RATIONALE</span>
                      <ul className="flex flex-col gap-1.5 text-xs font-mono">
                        {prediction.whyWin.slice(0, 3).map((reason, i) => (
                          <li key={i} className="flex gap-2 border-l border-primary/30 pl-2">
                            <span className="text-primary flex-shrink-0">{'>'}</span>
                            <span className="opacity-80 leading-relaxed">{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Strategy note */}
                  {prediction.strategyNote && (
                    <div className="p-3 border border-amber-500/40 bg-amber-500/5 text-amber-400 text-xs font-mono leading-relaxed">
                      [!] {prediction.strategyNote}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-8">
                  <div className="text-primary/20 text-3xl font-bold">[ ]</div>
                  <div className="text-xs opacity-40 uppercase tracking-widest">
                    AWAITING_PREDICTION
                  </div>
                  <div className="text-xs opacity-30 max-w-[200px] leading-relaxed">
                    Run a prediction from the Dashboard to populate this panel.
                  </div>
                </div>
              )}
            </div>
          </ASCIIBox>

          {/* WDC Standings */}
          <ASCIIBox title="CURRENT_WDC_PRIOR_STATE">
            <div className="text-xs opacity-70 mb-4">
              Model inputs are heavily influenced by current championship standing momentum.
            </div>
            <div className="flex flex-col gap-1">
              {standingsLoading ? (
                <TerminalText text="LOADING_STANDINGS..." />
              ) : (
                (standings as any[])?.slice(0, 10).map((d: any) => (
                  <div key={d.driver} className="flex items-center gap-2 text-xs py-1 hover:bg-primary/10 px-1 transition-colors">
                    <span className="w-4 text-right opacity-50 flex-shrink-0">{d.position}</span>
                    <span className="w-24 font-bold truncate">{d.driver?.split(' ').pop()}</span>
                    <div className="flex-1 h-2 bg-primary/10 relative min-w-0">
                      <div
                        className="absolute left-0 top-0 h-full"
                        style={{
                          width: `${(d.points / maxPoints) * 100}%`,
                          backgroundColor: d.teamColor || 'var(--color-primary)',
                        }}
                      />
                    </div>
                    <span className="w-10 text-right text-primary font-mono flex-shrink-0">{d.points}</span>
                  </div>
                ))
              )}
            </div>
          </ASCIIBox>

        </div>
      </div>
    </div>
  );
}
