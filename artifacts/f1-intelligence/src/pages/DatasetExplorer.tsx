import React, { useState, useEffect, useRef } from 'react';
import { useGetDataset } from '@workspace/api-client-react';
import { ASCIIBox } from '../components/ASCIIBox';
import { TerminalText } from '../components/TerminalText';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DatasetExplorer() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [yearFilter, setYearFilter] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(0);
  const limit = 50;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search so we don't fire on every keystroke
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput.trim() || undefined);
      setPage(0);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  const { data, isLoading } = useGetDataset({
    search,
    year: yearFilter,
    limit,
    offset: page * limit,
  });

  // data shape from API: { total: number, rows: DatasetRow[] }
  const rows: any[] = (data as any)?.rows ?? [];
  const total: number = (data as any)?.total ?? 0;
  const startRecord = total === 0 ? 0 : page * limit + 1;
  const endRecord = Math.min(page * limit + rows.length, total);
  const hasNextPage = endRecord < total;

  const handlePrevPage = () => setPage((p) => Math.max(0, p - 1));
  const handleNextPage = () => { if (hasNextPage) setPage((p) => p + 1); };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="border-b border-primary/30 pb-4">
        <h1 className="text-3xl font-bold tracking-widest glow-text uppercase mb-2">DATASET_EXPLORER</h1>
        <p className="text-primary/60 text-sm uppercase tracking-widest">RAW HISTORICAL RACE DATA &amp; TELEMETRY INDEX</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="text-xs opacity-70 uppercase mb-1 block">GLOBAL_SEARCH_</label>
          <div className="flex items-center bg-background border border-primary/50 focus-within:border-primary px-3 transition-colors h-10">
            <Search className="w-4 h-4 opacity-50 flex-shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="SEARCH DRIVER, TEAM, CIRCUIT..."
              className="bg-transparent text-primary w-full p-2 focus:outline-none placeholder:text-primary/30 text-sm uppercase"
            />
          </div>
        </div>

        <div className="w-full md:w-48">
          <label className="text-xs opacity-70 uppercase mb-1 block">SEASON_FILTER_</label>
          <div className="flex items-center bg-background border border-primary/50 focus-within:border-primary px-3 transition-colors h-10">
            <Filter className="w-4 h-4 opacity-50 flex-shrink-0" />
            <select
              value={yearFilter || ''}
              onChange={(e) => {
                setYearFilter(e.target.value ? Number(e.target.value) : undefined);
                setPage(0);
              }}
              className="bg-transparent text-primary w-full p-2 focus:outline-none appearance-none text-sm uppercase"
            >
              <option value="">ALL_SEASONS</option>
              {[2024, 2023, 2022].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <ASCIIBox title="RAW_DATA_INDEX" className="min-h-[500px]">
        {/* Pagination header */}
        <div className="flex justify-between items-center mb-4 text-xs opacity-70 border-b border-primary/20 pb-2">
          <span>
            {isLoading
              ? 'QUERYING_DATABASE...'
              : total === 0
              ? 'NO_RECORDS_MATCH_QUERY'
              : `SHOWING ${startRecord}-${endRecord} OF ${total} RECORDS`}
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevPage}
              disabled={page === 0 || isLoading}
              className="hover:text-primary hover:glow-text disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>PAGE_{page + 1}</span>
            <button
              onClick={handleNextPage}
              disabled={!hasNextPage || isLoading}
              className="hover:text-primary hover:glow-text disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead className="text-primary/50 border-b border-primary/30 font-bold tracking-wider">
              <tr>
                <th className="pb-3 px-2">YEAR</th>
                <th className="pb-3 px-2">RND</th>
                <th className="pb-3 px-2">RACE</th>
                <th className="pb-3 px-2">CIRCUIT</th>
                <th className="pb-3 px-2">DRIVER</th>
                <th className="pb-3 px-2">TEAM</th>
                <th className="pb-3 px-2 text-right">GRID</th>
                <th className="pb-3 px-2 text-right">POS</th>
                <th className="pb-3 px-2 text-right">PTS</th>
                <th className="pb-3 px-2">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <tr key={i} className="border-b border-primary/5">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-2 py-2">
                        <div className="h-2 bg-primary/10 animate-pulse" style={{ width: `${40 + ((i * j) % 5) * 10}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length > 0 ? (
                rows.map((row: any, i: number) => (
                  <tr
                    key={i}
                    className="border-b border-primary/10 hover:bg-primary/5 transition-colors group"
                  >
                    <td className="px-2 py-2 opacity-60">{row.year}</td>
                    <td className="px-2 py-2 font-bold opacity-80">{String(row.round).padStart(2, '0')}</td>
                    <td className="px-2 py-2 uppercase truncate max-w-[160px]" title={row.raceName}>
                      {row.raceName}
                    </td>
                    <td className="px-2 py-2 uppercase truncate max-w-[140px] opacity-70" title={row.circuit}>
                      {row.circuit}
                    </td>
                    <td className="px-2 py-2 font-bold uppercase">{row.driver}</td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        {row.team && (
                          <span
                            className="w-1.5 h-3 inline-block flex-shrink-0"
                            style={{ backgroundColor: '#00ff41', opacity: 0.7 }}
                          />
                        )}
                        <span className="uppercase opacity-80 truncate max-w-[120px]">{row.team}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-right opacity-70">
                      {row.gridPosition ?? '—'}
                    </td>
                    <td className="px-2 py-2 text-right font-mono font-bold text-primary">
                      {row.position ?? 'DNF'}
                    </td>
                    <td className="px-2 py-2 text-right font-mono opacity-80">{row.points}</td>
                    <td className="px-2 py-2 opacity-50 uppercase truncate max-w-[80px]" title={row.status}>
                      {row.status === 'Finished' ? 'FIN' : row.status?.slice(0, 8) || '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="p-12 text-center border border-dashed border-primary/30 text-primary/50 uppercase"
                  >
                    {search || yearFilter
                      ? '[NULL_SET] NO_RECORDS_MATCH_QUERY_PARAMETERS'
                      : '[EMPTY] NO_DATA_LOADED'}
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
