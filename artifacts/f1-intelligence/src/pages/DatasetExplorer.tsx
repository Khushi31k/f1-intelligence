import React, { useState } from 'react';
import { useGetDataset } from '@workspace/api-client-react';
import { ASCIIBox } from '../components/ASCIIBox';
import { TerminalText } from '../components/TerminalText';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DatasetExplorer() {
  const currentYear = new Date().getFullYear();
  
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(0);
  const limit = 50;

  // We use debounce internally in the mind, but here we'll just pass search directly 
  // as the hook will refetch when dependencies change.
  // In a real app, a proper useDebounce hook would be better for text input.
  
  const { data, isLoading } = useGetDataset({ 
    search: search || undefined, 
    year: yearFilter,
    limit,
    offset: page * limit
  });

  const handlePrevPage = () => setPage(p => Math.max(0, p - 1));
  const handleNextPage = () => {
    if (data && data.length === limit) {
      setPage(p => p + 1);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10 h-full">
      <div className="border-b border-primary/30 pb-4">
        <h1 className="text-3xl font-bold tracking-widest glow-text uppercase mb-2">DATASET_EXPLORER</h1>
        <p className="text-primary/60 text-sm uppercase tracking-widest">RAW HISTORICAL RACE DATA & TELEMETRY INDEX</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="text-xs opacity-70 uppercase mb-1 block">GLOBAL_SEARCH_</label>
          <div className="flex items-center bg-background border border-primary/50 focus-within:border-primary px-3 transition-colors h-10">
            <Search className="w-4 h-4 opacity-50" />
            <input 
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="SEARCH DRIVER, TEAM, CIRCUIT..."
              className="bg-transparent text-primary w-full p-2 focus:outline-none placeholder:text-primary/30 text-sm uppercase"
            />
          </div>
        </div>

        <div className="w-full md:w-48">
          <label className="text-xs opacity-70 uppercase mb-1 block">SEASON_FILTER_</label>
          <div className="flex items-center bg-background border border-primary/50 focus-within:border-primary px-3 transition-colors h-10">
            <Filter className="w-4 h-4 opacity-50" />
            <select 
              value={yearFilter || ''}
              onChange={(e) => { setYearFilter(e.target.value ? Number(e.target.value) : undefined); setPage(0); }}
              className="bg-transparent text-primary w-full p-2 focus:outline-none appearance-none text-sm uppercase"
            >
              <option value="">ALL_SEASONS</option>
              {[2024, 2023, 2022].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <ASCIIBox title="RAW_DATA_INDEX" className="flex-1 min-h-[500px]">
        
        <div className="flex justify-between items-center mb-4 text-xs opacity-70 border-b border-primary/20 pb-2">
          <span>{isLoading ? 'QUERYING_DATABASE...' : `SHOWING_RECORDS ${(page * limit) + (data?.length ? 1 : 0)}-${(page * limit) + (data?.length || 0)}`}</span>
          <div className="flex items-center gap-4">
            <button 
              onClick={handlePrevPage} 
              disabled={page === 0 || isLoading}
              className="hover:text-primary hover:glow-text disabled:opacity-30 disabled:hover:glow-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>PAGE_{page + 1}</span>
            <button 
              onClick={handleNextPage} 
              disabled={!data || data.length < limit || isLoading}
              className="hover:text-primary hover:glow-text disabled:opacity-30 disabled:hover:glow-none transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead className="text-primary/50 border-b border-primary/30 font-bold tracking-wider">
              <tr>
                <th className="pb-3 px-2">YEAR</th>
                <th className="pb-3 px-2">RND</th>
                <th className="pb-3 px-2">CIRCUIT</th>
                <th className="pb-3 px-2">DRIVER</th>
                <th className="pb-3 px-2">TEAM</th>
                <th className="pb-3 px-2 text-right">POS</th>
                <th className="pb-3 px-2 text-right">PTS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({length: 10}).map((_, i) => (
                  <tr key={i} className="border-b border-primary/5">
                    <td colSpan={7} className="p-4 text-center opacity-30">
                      <TerminalText text="...................................." speed={10} showCursor={i === 0} delay={i * 100} />
                    </td>
                  </tr>
                ))
              ) : data && data.length > 0 ? (
                data.map((row, i) => (
                  <tr key={i} className="border-b border-primary/10 hover:bg-primary/10 transition-colors group">
                    <td className="p-2 opacity-80">{row.round}</td> {/* Schema driver race result only has round in schema but we use it as year stand-in for table formatting if needed, API dictates data */}
                    <td className="p-2 font-bold">{row.round.toString().padStart(2, '0')}</td>
                    <td className="p-2 uppercase truncate max-w-[150px]">{row.raceName}</td>
                    <td className="p-2 font-bold uppercase">{row.position ? `DRIVER_P${row.position}` : 'DRIVER'}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        {row.teamColor && (
                          <span className="w-2 h-2 inline-block" style={{ backgroundColor: row.teamColor.startsWith('#') ? row.teamColor : `#${row.teamColor}` }} />
                        )}
                        <span className="uppercase opacity-90 truncate max-w-[150px]">{row.team}</span>
                      </div>
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-primary">{row.position || 'DNF'}</td>
                    <td className="p-2 text-right font-mono opacity-80">{row.points}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center border border-dashed border-primary/30 text-primary/50 uppercase">
                    [NULL_SET] NO_RECORDS_MATCH_QUERY_PARAMETERS
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ASCIIBox>
    </div>
  );
}
