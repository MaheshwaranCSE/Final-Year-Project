import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  InputBase,
  Typography,
  Divider,
  List,
  ListItem,
  Chip,
  IconButton
} from '@mui/material';
import {
  Search,
  FolderOpen,
  FileCode,
  Blocks,
  FileText,
  X,
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForensicStore } from '../../stores/useForensicStore';

interface GlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { cases, evidence, blocks, auditLogs } = useForensicStore();

  useEffect(() => {
    if (open) {
      setQuery('');
    }
  }, [open]);

  // Global Ctrl+K / Cmd+K handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (open) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { cases: [], evidence: [], blocks: [], auditLogs: [] };

    const matchedCases = cases.filter(c =>
      c.caseNumber.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.leadInvestigatorName.toLowerCase().includes(q)
    ).slice(0, 5);

    const matchedEvidence = evidence.filter(e =>
      e.evidenceNumber.toLowerCase().includes(q) ||
      e.title.toLowerCase().includes(q) ||
      e.sha256Original.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.caseNumber.toLowerCase().includes(q)
    ).slice(0, 6);

    const matchedBlocks = blocks.filter(b =>
      b.blockHeight.toString().includes(q) ||
      b.blockHash.toLowerCase().includes(q) ||
      b.transactions.some(tx => tx.txId.toLowerCase().includes(q) || tx.evidenceNumber.toLowerCase().includes(q) || tx.evidenceHash.toLowerCase().includes(q))
    ).slice(0, 4);

    const matchedLogs = auditLogs.filter(a =>
      a.action.toLowerCase().includes(q) ||
      a.resourceId.toLowerCase().includes(q) ||
      a.details.toLowerCase().includes(q)
    ).slice(0, 4);

    return {
      cases: matchedCases,
      evidence: matchedEvidence,
      blocks: matchedBlocks,
      auditLogs: matchedLogs
    };
  }, [query, cases, evidence, blocks, auditLogs]);

  const hasResults =
    results.cases.length > 0 ||
    results.evidence.length > 0 ||
    results.blocks.length > 0 ||
    results.auditLogs.length > 0;

  const handleSelectCase = (id: string) => {
    onClose();
    navigate(`/cases/${id}`);
  };

  const handleSelectEvidence = (id: string) => {
    onClose();
    navigate(`/evidence/${id}`);
  };

  const handleSelectBlockchain = () => {
    onClose();
    navigate('/blockchain');
  };

  const handleSelectAudit = () => {
    onClose();
    navigate('/audit');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#0C101D',
          color: '#FFFFFF',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 3,
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.85), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
          overflow: 'hidden'
        }
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <Search size={20} color="#06B6D4" />
        <InputBase
          autoFocus
          placeholder="Search by Case ID, Evidence #, SHA-256 hash, Block #, or keyword..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          sx={{
            flex: 1,
            color: '#FFFFFF',
            fontSize: '1.05rem',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Inter', monospace",
            '& input::placeholder': {
              color: '#64748B',
              fontFamily: "'Inter', sans-serif"
            }
          }}
        />
        {query && (
          <IconButton size="small" onClick={() => setQuery('')} sx={{ color: '#64748B' }}>
            <X size={18} />
          </IconButton>
        )}
        <Chip
          label="ESC"
          size="small"
          onClick={onClose}
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.06)',
            color: '#94A3B8',
            fontSize: '0.7rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        />
      </Box>

      <DialogContent sx={{ p: 2, maxHeight: 520, overflowY: 'auto' }}>
        {!query.trim() ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Search by Case Number, Evidence ID, SHA-256 digest, Block Height, or Audit Action
            </Typography>
          </Box>
        ) : !hasResults ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ color: '#EF4444', mb: 1 }}>
              No forensic records matching &quot;{query}&quot;
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Check spelling or try a case number, evidence ID, or partial cryptographic hash
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* EVIDENCE RESULTS */}
            {results.evidence.length > 0 && (
              <Box>
                <Typography variant="caption" sx={{ color: '#60A5FA', fontWeight: 700, px: 1, letterSpacing: '0.08em' }}>
                  EVIDENCE ({results.evidence.length})
                </Typography>
                <List dense sx={{ mt: 0.5, p: 0 }}>
                  {results.evidence.map(e => (
                    <ListItem
                      key={e.id}
                      onClick={() => handleSelectEvidence(e.id)}
                      sx={{
                        borderRadius: 1.5,
                        px: 1.5,
                        py: 1,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.1)' }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
                        <FileCode size={18} color="#38BDF8" />
                        <Box sx={{ overflow: 'hidden' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                              {e.evidenceNumber}
                            </Typography>
                            <Typography variant="body2" noWrap sx={{ color: '#94A3B8' }}>
                              {e.title}
                            </Typography>
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#64748B',
                              fontFamily: 'monospace',
                              fontSize: '0.72rem',
                              display: 'block'
                            }}
                          >
                            SHA-256: {e.sha256Original.slice(0, 24)}...
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={e.integrityStatus}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            bgcolor: e.integrityStatus === 'VERIFIED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: e.integrityStatus === 'VERIFIED' ? '#10B981' : '#EF4444'
                          }}
                        />
                        <ArrowRight size={16} color="#64748B" />
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* CASES RESULTS */}
            {results.cases.length > 0 && (
              <Box>
                <Typography variant="caption" sx={{ color: '#34D399', fontWeight: 700, px: 1, letterSpacing: '0.08em' }}>
                  CASES ({results.cases.length})
                </Typography>
                <List dense sx={{ mt: 0.5, p: 0 }}>
                  {results.cases.map(c => (
                    <ListItem
                      key={c.id}
                      onClick={() => handleSelectCase(c.id)}
                      sx={{
                        borderRadius: 1.5,
                        px: 1.5,
                        py: 1,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.1)' }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <FolderOpen size={18} color="#34D399" />
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                              {c.caseNumber}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
                              {c.title}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            Lead: {c.leadInvestigatorName} • Status: {c.status}
                          </Typography>
                        </Box>
                      </Box>
                      <ArrowRight size={16} color="#64748B" />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* BLOCKCHAIN BLOCKS */}
            {results.blocks.length > 0 && (
              <Box>
                <Typography variant="caption" sx={{ color: '#FBBF24', fontWeight: 700, px: 1, letterSpacing: '0.08em' }}>
                  BLOCKCHAIN BLOCKS ({results.blocks.length})
                </Typography>
                <List dense sx={{ mt: 0.5, p: 0 }}>
                  {results.blocks.map(b => (
                    <ListItem
                      key={b.blockHeight}
                      onClick={handleSelectBlockchain}
                      sx={{
                        borderRadius: 1.5,
                        px: 1.5,
                        py: 1,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.1)' }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Blocks size={18} color="#FBBF24" />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                            Block #{b.blockHeight} ({b.transactions.length} txs)
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94A3B8', fontFamily: 'monospace' }}>
                            Hash: {b.blockHash.slice(0, 28)}...
                          </Typography>
                        </Box>
                      </Box>
                      <ArrowRight size={16} color="#64748B" />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* AUDIT LOGS */}
            {results.auditLogs.length > 0 && (
              <Box>
                <Typography variant="caption" sx={{ color: '#A78BFA', fontWeight: 700, px: 1, letterSpacing: '0.08em' }}>
                  AUDIT LOGS ({results.auditLogs.length})
                </Typography>
                <List dense sx={{ mt: 0.5, p: 0 }}>
                  {results.auditLogs.map(a => (
                    <ListItem
                      key={a.id}
                      onClick={handleSelectAudit}
                      sx={{
                        borderRadius: 1.5,
                        px: 1.5,
                        py: 1,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        '&:hover': { bgcolor: 'rgba(167, 139, 250, 0.1)' }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <FileText size={18} color="#A78BFA" />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                            {a.action} ({a.resourceType})
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                            {a.details}
                          </Typography>
                        </Box>
                      </Box>
                      <ArrowRight size={16} color="#64748B" />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
