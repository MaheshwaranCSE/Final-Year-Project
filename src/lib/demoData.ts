import { setLS, getLS } from './supabase';

export const initializeDemoData = () => {
  const isInitialized = getLS('demo_initialized', false);
  if (isInitialized) return;

  const demoEvidence = [
    {
      id: 'EV-001',
      evidenceId: 'EV-001',
      title: 'CCTV Footage - Main Street Incident',
      description: 'Clear CCTV footage from the intersection showing the sequence of events leading up to the incident.',
      category: 'Video',
      publicStatus: 'PUBLIC',
      publicArea: 'Downtown District',
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      viewCount: 120,
      verificationStatus: 'VERIFIED',
      thumbnailUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=300&q=80',
      // Official engagement fields
      policeLikeCount: 3,
      adminLikeCount: 1,
      courtLikeCount: 1,
      officialLikeCount: 5,
      publicNews: true,
      status: 'Investigation'
    },
    {
      id: 'EV-002',
      evidenceId: 'EV-002',
      title: 'Recovered Mobile Device Data',
      description: 'Extracted communication logs and timestamp data relevant to the ongoing investigation.',
      category: 'Digital',
      publicStatus: 'PUBLIC',
      publicArea: 'Northside Area',
      timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
      viewCount: 89,
      verificationStatus: 'VERIFIED',
      thumbnailUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=300&q=80',
      policeLikeCount: 1,
      adminLikeCount: 1,
      courtLikeCount: 0,
      officialLikeCount: 2,
      publicNews: true,
      status: 'Investigation'
    },
    {
      id: 'EV-003',
      evidenceId: 'EV-003',
      title: 'Vehicle Dashcam Recording',
      description: 'Dashboard camera recording provided by a witness to the traffic collision.',
      category: 'Video',
      publicStatus: 'PUBLIC',
      publicArea: 'Highway 42',
      timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
      viewCount: 340,
      verificationStatus: 'VERIFIED',
      thumbnailUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=300&q=80',
      policeLikeCount: 4,
      adminLikeCount: 2,
      courtLikeCount: 2,
      officialLikeCount: 8,
      publicNews: true,
      status: 'Investigation'
    },
    {
      id: 'EV-004',
      evidenceId: 'EV-004',
      title: 'Cyber Fraud Screenshot Evidence',
      description: 'Screenshots of fraudulent online transactions submitted by victim.',
      category: 'Cyber Crime',
      publicStatus: 'PUBLIC',
      publicArea: 'Puducherry Area',
      timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
      viewCount: 45,
      verificationStatus: 'VERIFIED',
      thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=300&q=80',
      policeLikeCount: 0,
      adminLikeCount: 0,
      courtLikeCount: 0,
      officialLikeCount: 0,
      publicNews: false,
      status: 'Submitted'
    }
  ];

  const demoNews = [
    {
      id: 'N-001',
      title: 'New Digital Forensics Lab Opens',
      summary: 'State-of-the-art facility will handle complex digital evidence processing for the region.',
      category: 'Announcement',
      area: 'Statewide',
      publishedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      status: 'PUBLISHED',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=150&q=80'
    },
    {
      id: 'N-002',
      title: 'Public Assistance Requested for Downtown Incident',
      summary: 'Authorities are asking anyone with mobile phone footage of yesterday\'s incident to submit it via the portal.',
      category: 'Request',
      area: 'Downtown District',
      publishedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      status: 'PUBLISHED',
      imageUrl: 'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?auto=format&fit=crop&w=150&q=80'
    }
  ];

  // Pre-seed official engagement audit logs
  const demoAuditLogs = [
    { id: '1', action: 'OFFICIAL_LIKE', actorRole: 'Police', actorId: 'POL-00001', entityId: 'EV-001', timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString() },
    { id: '2', action: 'OFFICIAL_LIKE', actorRole: 'Police', actorId: 'POL-00002', entityId: 'EV-001', timestamp: new Date(Date.now() - 86400000 * 1.4).toISOString() },
    { id: '3', action: 'OFFICIAL_LIKE', actorRole: 'Police', actorId: 'POL-00003', entityId: 'EV-001', timestamp: new Date(Date.now() - 86400000 * 1.3).toISOString() },
    { id: '4', action: 'OFFICIAL_LIKE', actorRole: 'Admin', actorId: 'ADMIN-001', entityId: 'EV-001', timestamp: new Date(Date.now() - 86400000 * 1.2).toISOString() },
    { id: '5', action: 'OFFICIAL_LIKE', actorRole: 'Court', actorId: 'COURT-001', entityId: 'EV-001', timestamp: new Date(Date.now() - 86400000 * 1.1).toISOString() },
    { id: '6', action: 'OFFICIAL_LIKE', actorRole: 'Police', actorId: 'POL-00001', entityId: 'EV-003', timestamp: new Date(Date.now() - 86400000 * 0.8).toISOString() },
    { id: '7', action: 'OFFICIAL_LIKE', actorRole: 'Admin', actorId: 'ADMIN-001', entityId: 'EV-003', timestamp: new Date(Date.now() - 86400000 * 0.7).toISOString() },
  ];

  setLS('mock_evidence', demoEvidence);
  setLS('mock_news', demoNews);
  setLS('mock_audit_logs', demoAuditLogs);
  setLS('demo_initialized', true);
};
