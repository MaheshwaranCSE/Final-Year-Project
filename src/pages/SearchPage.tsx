import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShieldCheck, Newspaper, ArrowRight, ExternalLink } from 'lucide-react';
import Navbar from '../components/Navbar';
import { getLS } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ evidence: any[]; news: any[] }>({
    evidence: [],
    news: [],
  });
  const [hasSearched, setHasSearched] = useState(false);
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const lowerQuery = query.toLowerCase();

    const allEvidence = getLS('mock_evidence', []);
    const allNews = getLS('mock_news', []);

    const matchedNews = allNews.filter(
      (n: any) =>
        n.status === 'PUBLISHED' &&
        (n.title?.toLowerCase().includes(lowerQuery) ||
          n.summary?.toLowerCase().includes(lowerQuery) ||
          n.category?.toLowerCase().includes(lowerQuery))
    );

    const matchedEvidence = allEvidence.filter((e: any) => {
      const matchesText =
        e.title?.toLowerCase().includes(lowerQuery) ||
        e.description?.toLowerCase().includes(lowerQuery) ||
        e.category?.toLowerCase().includes(lowerQuery) ||
        e.id?.toLowerCase().includes(lowerQuery);

      if (!matchesText) return false;

      if (!user) {
        return e.publicStatus === 'PUBLIC' && e.publicNews === true;
      }

      if (role === 'admin') return true;
      if (role === 'court')
        return (
          e.status === 'Investigation' ||
          e.status === 'Medical Review Completed' ||
          e.status === 'Closed'
        );
      if (role === 'police' || role === 'investigator')
        return (
          e.publicStatus === 'PUBLIC' ||
          e.assignedPoliceId === user.id ||
          !e.assignedPoliceId
        );
      if (role === 'doctor') return e.assignedDoctorId === user.id;
      if (role === 'user')
        return (
          (e.publicStatus === 'PUBLIC' && e.publicNews === true) ||
          e.uploaderId === user.id ||
          e.uploaderEmail === user.email
        );

      return e.publicStatus === 'PUBLIC' && e.publicNews === true;
    });

    setResults({ evidence: matchedEvidence, news: matchedNews });
    setHasSearched(true);
  };

  return (
    <div className="min-h-screen bg-[#060911] text-zinc-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 pt-24 pb-16 space-y-8">
        {/* Banner */}
        <div className="bg-[#0C101D] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] rounded-2xl p-8 relative overflow-hidden text-center space-y-3">
          <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-cyan-500/10 via-cyan-500/5 to-transparent pointer-events-none" />
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-medium">
            DISCOVERY INDEX
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Search BlockVault Records
          </h1>
          <p className="text-sm font-mono text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Query across public and role-authorized forensic evidence archives, public notices, and chain-of-custody bulletins.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2.5 max-w-2xl mx-auto pt-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search evidence title, category, hash prefix, or news..."
                className="w-full bg-[#060911] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium font-mono text-xs transition-all flex items-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.4),0_0_20px_rgba(6,182,212,0.25)] active:scale-[0.98]"
            >
              Search
            </button>
          </form>
        </div>

        {/* Results Area */}
        {hasSearched && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-mono text-zinc-400">
                Found <strong className="text-cyan-400">{results.evidence.length}</strong> Evidence Record(s) and <strong className="text-cyan-400">{results.news.length}</strong> News Article(s)
              </span>
            </div>

            {results.evidence.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Forensic Evidence Results
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {results.evidence.map((item) => (
                    <div
                      key={item.id}
                      onClick={() =>
                        navigate(
                          item.publicStatus === 'PUBLIC'
                            ? `/evidence/${item.id}`
                            : `/cases/${item.caseId || item.id}`
                        )
                      }
                      className="p-5 rounded-2xl bg-[#0C101D] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-cyan-500/40 cursor-pointer transition-all space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-white/[0.04] text-zinc-300 border border-white/[0.08]">
                              {item.category}
                            </span>
                            {item.publicNews && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                Official Bulletin
                              </span>
                            )}
                            <span className="text-xs font-mono text-zinc-500">
                              ID: {item.id}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition">
                            {item.title}
                          </h4>
                        </div>
                        <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 transition shrink-0 mt-1" />
                      </div>
                      {item.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-cyan-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Official Interest Endorsements: {item.officialLikeCount || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.news.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold flex items-center gap-2">
                  <Newspaper className="w-4 h-4" />
                  Forensic Bulletins & News
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {results.news.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-[#0C101D] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] space-y-2"
                    >
                      <h4 className="text-base font-bold text-white">
                        {item.title}
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {item.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.evidence.length === 0 && results.news.length === 0 && (
              <div className="p-12 text-center rounded-2xl bg-[#0C101D] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] space-y-2">
                <Search className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs font-mono text-zinc-400">
                  No forensic records or published articles matched your search query.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
