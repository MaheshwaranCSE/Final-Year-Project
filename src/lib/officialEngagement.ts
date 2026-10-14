import { getLS, setLS } from './supabase';

type OfficialRole = 'police' | 'admin' | 'court';

const ROLE_LIKE_FIELD: Record<OfficialRole, string> = {
  police: 'policeLikeCount',
  admin: 'adminLikeCount',
  court: 'courtLikeCount',
};

/**
 * Check if the given actor has already officially liked the evidence.
 */
export function hasOfficiallyLiked(actorId: string, evidenceId: string): boolean {
  const logs: any[] = getLS('mock_audit_logs', []);
  return logs.some(
    (l) => l.action === 'OFFICIAL_LIKE' && l.actorId === actorId && l.entityId === evidenceId
  );
}

/**
 * Record an official like from an authorized role (police, admin, court).
 * - Increments the role-specific like count and officialLikeCount.
 * - Sets publicNews = true (evidence becomes news-eligible).
 * - Writes an OFFICIAL_LIKE audit log.
 * Returns the updated evidence object, or null if already liked.
 */
export function recordOfficialLike(
  evidenceId: string,
  actorId: string,
  actorRole: OfficialRole
): any | null {
  // Guard: prevent duplicate
  if (hasOfficiallyLiked(actorId, evidenceId)) return null;

  const roleField = ROLE_LIKE_FIELD[actorRole];

  // Update evidence record
  const allEvidence: any[] = getLS('mock_evidence', []);
  let updatedItem: any = null;
  const updated = allEvidence.map((e: any) => {
    if (e.id === evidenceId) {
      updatedItem = {
        ...e,
        [roleField]: (e[roleField] || 0) + 1,
        officialLikeCount: (e.officialLikeCount || 0) + 1,
        publicNews: true, // evidence becomes news-eligible
      };
      return updatedItem;
    }
    return e;
  });
  setLS('mock_evidence', updated);

  // Write audit log
  const logs: any[] = getLS('mock_audit_logs', []);
  logs.push({
    id: Date.now().toString(),
    action: 'OFFICIAL_LIKE',
    actorRole: actorRole.charAt(0).toUpperCase() + actorRole.slice(1),
    actorId,
    entityId: evidenceId,
    timestamp: new Date().toISOString(),
  });
  setLS('mock_audit_logs', logs);

  return updatedItem;
}

/**
 * Remove public-news status from an evidence item (admin only).
 */
export function removeFromNews(evidenceId: string, actorId: string): void {
  const allEvidence: any[] = getLS('mock_evidence', []);
  const updated = allEvidence.map((e: any) =>
    e.id === evidenceId ? { ...e, publicNews: false } : e
  );
  setLS('mock_evidence', updated);

  const logs: any[] = getLS('mock_audit_logs', []);
  logs.push({
    id: Date.now().toString(),
    action: 'REMOVED_FROM_NEWS',
    actorRole: 'Admin',
    actorId,
    entityId: evidenceId,
    timestamp: new Date().toISOString(),
  });
  setLS('mock_audit_logs', logs);
}
