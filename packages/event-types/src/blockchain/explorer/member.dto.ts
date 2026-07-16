// =============================================================================
// MemberDto — matches apps/web/lib/explorer-mock.ts `GovernanceMember`.
// `NONE` role is filtered out server-side; user data is joined from UserAccount.
// =============================================================================

export type MemberRole = 'MEMBER' | 'ELDER';

export interface MemberDto {
  id: string;
  userId: string;
  walletAddress: string;
  role: MemberRole;
  user: {
    name: string | null;
    email: string | null;
  };
}
