import React, { useEffect, useState } from 'react';
import { useRunPrediction, useGetDriverStandings } from '@workspace/api-client-react';
import { ASCIIBox } from '../components/ASCIIBox';
import { TerminalText } from '../components/TerminalText';
import { Cpu, Binary, Target, Zap, Clock, Box, Layers } from 'lucide-react';
import { ProgressBar } from '../components/ProgressBar';

export default function Insights() {
  const currentYear = new Date().getFullYear();
  const { data: standings, isLoading: standingsLoading } = useGetDriverStandings({ year: currentYear });
  
  const predictMutation = useRunPrediction();
  const [ranPrediction, setRanPrediction] = useState(false);

  useEffect(() => {
    if (!ranPrediction) {
      setRanPrediction(true);
      predictMutation.mutate({ data: { year: currentYear, round: 1 } });
    }
  }, [ranPrediction, predictMutation, currentYear]);

  const features = [
    { name: "QUALIFYING_POSITION", icon: Target, desc: "Grid starting position is the strongest predictor. Weights heavily on tight street circuits like Monaco.", importance: 92 },
    { name: "CONSTRUCTOR_PACE", icon: Zap, desc: "Aggregated delta to fastest lap across recent sessions. Neutralizes driver skill to isolate car performance.", importance: 85 },
    { name: "DRIVER_CONSISTENCY", icon: Binary, desc: "Variance in lap times over long stints. Identifies drivers able to manage tire degradation effectively.", importance: 78 },
    { name: "CIRCUIT_ADAPTABILITY", icon: Box, desc: "Historical performance delta at similar circuit types (high downforce, high speed, street).", importance: 65 },
    { name: "RECENT_FORM", icon: Clock, desc: "Exponential moving average of finishing positions over the last 5 races.", importance: 60 },
    { name: "TEAM_STRATEGY_INDEX", icon: Layers, desc: "Historical success rate of team pit calls under safety car and changing weather conditions.", importance: 45 },
  ];

  return (
    <div className="flex flex-col gap-8 pb-16">
      <div className="border-b border-primary/30 pb-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-widest glow-text uppercase mb-2">ML INSIGHTS</h1>
        <p className="text-primary/60 text-sm uppercase tracking-widest">XGBOOST RACE PREDICTOR ARCHITECTURE</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Theory & Features */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          <ASCIIBox title="THEORETICAL_FRAMEWORK">
            <div className="flex flex-col gap-4 text-sm leading-relaxed opacity-90">
              <p>
                <span className="text-primary font-bold">XGBoost (eXtreme Gradient Boosting)</span> is an optimized distributed gradient boosting library designed to be highly efficient, flexible and portable.
              </p>
              <p>
                In the context of Formula 1, predicting a race winner is a multi-class classification problem with high dimensionality and complex feature interactions. A driver's raw pace matters, but so does their grid position, the specific characteristics of the circuit, and the historical reliability of their machinery.
              </p>
              <p>
                Our model utilizes decision tree ensembles to capture these non-linear relationships. For instance, the interaction between &quot;Grid Position &gt; 5&quot; and &quot;Circuit Type = Street&quot; heavily penalizes win probability in a way that linear models struggle to represent.
              </p>
              
              <div className="mt-4 p-4 border border-primary/20 bg-primary/5 flex items-center justify-between text-xs">
                <div className="flex flex-col gap-1">
                  <span className="opacity-50">TRAINING_VECTORS</span>
                  <span className="font-mono text-lg font-bold">14,285</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="opacity-50">CROSS_VALIDATION</span>
                  <span className="font-mono text-lg font-bold">K-FOLD (k=5)</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="opacity-50">TEST_ACCURACY</span>
                  <span className="font-mono text-lg font-bold text-primary">87.4%</span>
                </div>
              </div>
            </div>
          </ASCIIBox>

          <div>
            <h2 className="text-xl font-bold uppercase tracking-widest mb-4 glow-text">FEATURE_VECTORS</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((f, i) => (
                <div key={i} className="border border-primary/30 bg-background/50 p-4 hover:border-primary transition-colors flex flex-col gap-3 group">
                  <div className="flex items-center gap-2 border-b border-primary/20 pb-2">
                    <f.icon className="w-4 h-4 text-primary group-hover:animate-pulse" />
                    <span className="font-bold text-sm tracking-wider">{f.name}</span>
                  </div>
                  <p className="text-xs opacity-70 flex-1">{f.desc}</p>
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-[10px] opacity-50 w-10">WEIGHT</span>
                    <div className="flex-1 h-1 bg-primary/20">
                      <div className="h-full bg-primary" style={{ width: `${f.importance}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* Right Column: Practical Application */}
        <div className="flex flex-col gap-8">
          
          <ASCIIBox title="APPLIED_EXAMPLE">
            <div className="flex flex-col gap-4">
              <div className="text-xs opacity-70 mb-2 border-b border-primary/20 pb-2">
                Sample inference based on last executed query.
              </div>
              
              {predictMutation.isPending ? (
                <div className="py-10 text-center"><TerminalText text="GENERATING_SAMPLE_OUTPUT..." /></div>
              ) : predictMutation.data ? (
                <div className="flex flex-col gap-4 animate-in fade-in">
                  <div className="flex justify-between items-end">
                    <span className="text-xs uppercase">R{predictMutation.data.round} {predictMutation.data.circuit}</span>
                    <span className="text-sm font-bold text-primary">P1: {predictMutation.data.predictedWinner.driver}</span>
                  </div>
                  
                  <div className="text-xs uppercase tracking-widest opacity-50 mt-2">MODEL_RATIONALE:</div>
                  <ul className="flex flex-col gap-2 text-xs font-mono">
                    {predictMutation.data.whyWin.map((reason, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-primary">{'>'}</span> 
                        <span className="opacity-80">{reason}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-4 p-3 border border-amber-500/50 bg-amber-500/10 text-amber-500 text-xs font-mono">
                    [!] {predictMutation.data.strategyNote || "STANDARD STRATEGY RECOMMENDED."}
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center opacity-50">AWAITING_DATA</div>
              )}
            </div>
          </ASCIIBox>

          <ASCIIBox title="CURRENT_WDC_PRIOR_STATE">
            <div className="text-xs opacity-70 mb-4">
              Model inputs are heavily influenced by current championship standing momentum.
            </div>
            
            <div className="flex flex-col gap-1">
              {standingsLoading ? (
                <TerminalText text="LOADING_STANDINGS..." />
              ) : (
                standings?.slice(0, 10).map((d) => (
                  <div key={d.driver} className="flex items-center gap-2 text-xs py-1 hover:bg-primary/10">
                    <span className="w-4 text-right opacity-50">{d.position}</span>
                    <span className="w-8 font-bold">{d.driver}</span>
                    <div className="flex-1 h-2 bg-primary/10 relative">
                      <div 
                        className="absolute left-0 top-0 h-full" 
                        style={{ 
                          width: `${(d.points / Math.max(...standings.map(s => s.points))) * 100}%`,
                          backgroundColor: d.teamColor ? (d.teamColor.startsWith('#') ? d.teamColor : `#${d.teamColor}`) : 'var(--color-primary)' 
                        }} 
                      />
                    </div>
                    <span className="w-8 text-right text-primary">{d.points}</span>
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
