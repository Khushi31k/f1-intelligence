import React from 'react';
import { Link } from 'wouter';
import { ASCIIBox } from '../components/ASCIIBox';
import { TerminalText } from '../components/TerminalText';

const steps = [
  {
    id: '01',
    title: 'SELECT A RACE',
    description:
      'Navigate to the Dashboard. Choose a season (2022–2024) and a Grand Prix from the dropdown. The system loads historical data for that event.',
    detail: 'DATA SOURCE: Jolpica F1 API (Ergast-compatible) — race results, qualifying positions, championship standings.',
  },
  {
    id: '02',
    title: 'EXECUTE THE MODEL',
    description:
      'Press the EXECUTE button to trigger the XGBoost inference pipeline. The model calculates predicted finishing positions for all drivers.',
    detail: 'MODEL: XGBoost Regressor trained on ~1,200+ historical race entries from 2021–2024.',
  },
  {
    id: '03',
    title: 'READ THE OUTPUT',
    description:
      'The Prediction Output panel renders the predicted winner, animated P1/P2/P3 podium, full top-10 grid with confidence scores, and feature importance chart.',
    detail: 'CONFIDENCE: Derived from the spread of predicted positions across the starting grid.',
  },
  {
    id: '04',
    title: 'EXPLORE ANALYTICS',
    description:
      'Six interactive charts below the predictor surface deeper context — driver season trajectory, constructor points progression, win %, pole positions, circuit history, and average finish.',
    detail: 'All charts update when you change the selected season.',
  },
  {
    id: '05',
    title: 'INSPECT ML INSIGHTS',
    description:
      'The ML Insights page shows the theoretical framework, feature vectors that drive the model, and a live Applied Example that updates every time you run a new prediction from the Dashboard.',
    detail: 'The Applied Example panel always reflects the most recent Execute result.',
  },
  {
    id: '06',
    title: 'EXPLORE HISTORICAL DATA',
    description:
      'The Dataset Explorer gives you direct access to the raw race data used to train the model. Search by driver, team, or circuit. Filter by season. Paginate through all records.',
    detail: 'RECORDS: Race results for 2022, 2023, and 2024 seasons.',
  },
];

const features = [
  { label: 'ML MODEL', value: 'XGBoost Regressor' },
  { label: 'TRAINING DATA', value: '2021–2024 Seasons' },
  { label: 'TRAINING ROWS', value: '~1,200+ Race Entries' },
  { label: 'KEY FEATURES', value: 'Grid Position, Points, Wins, Avg Finish' },
  { label: 'DATA SOURCE', value: 'Jolpica F1 / Ergast API' },
  { label: 'FRONTEND', value: 'React + Vite + Recharts' },
  { label: 'BACKEND', value: 'Python FastAPI + Uvicorn' },
];

export default function HowItWorks() {
  return (
    <div className="flex flex-col gap-8 pb-16">
      <div className="border-b border-primary/30 pb-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-widest glow-text uppercase mb-2">
          HOW IT WORKS
        </h1>
        <p className="text-primary/60 text-sm uppercase tracking-widest">
          SYSTEM ARCHITECTURE &amp; USAGE GUIDE
        </p>
      </div>

      {/* Step-by-step */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold uppercase tracking-widest mb-2">PREDICTION_WORKFLOW</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className="border border-primary/30 bg-background/50 p-5 hover:border-primary transition-colors flex flex-col gap-3"
            >
              <div className="flex items-center gap-3 border-b border-primary/20 pb-3">
                <span className="text-2xl font-bold text-primary glow-text opacity-60">
                  [{step.id}]
                </span>
                <span className="font-bold text-sm tracking-wider">{step.title}</span>
              </div>
              <p className="text-sm opacity-80 leading-relaxed flex-1">{step.description}</p>
              <p className="text-xs opacity-40 font-mono border-l-2 border-primary/20 pl-3 mt-1">
                {step.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* System specs */}
      <ASCIIBox title="SYSTEM_SPECIFICATIONS">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.label} className="flex flex-col gap-1 border-l-2 border-primary/30 pl-3">
              <span className="text-[10px] opacity-50 uppercase tracking-widest">{f.label}</span>
              <span className="text-sm font-bold font-mono">{f.value}</span>
            </div>
          ))}
        </div>
      </ASCIIBox>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-primary/20">
        <Link
          href="/dashboard"
          className="border border-primary bg-primary/10 text-primary px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-primary hover:text-background transition-all group inline-flex items-center gap-2"
        >
          OPEN DASHBOARD{' '}
          <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
        </Link>
        <Link
          href="/insights"
          className="border border-primary/40 text-primary/60 hover:text-primary hover:border-primary px-6 py-3 text-sm font-bold uppercase tracking-widest transition-colors inline-flex items-center gap-2"
        >
          VIEW ML INSIGHTS
        </Link>
      </div>
    </div>
  );
}
