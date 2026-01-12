import { Suspense } from 'react';
import { Login } from '../login';
import { db } from '@/lib/db/drizzle';
import { invitations, teams } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

interface SignUpPageProps {
  searchParams: Promise<{ inviteId?: string; email?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const resolvedSearchParams = await searchParams;
  const inviteId = resolvedSearchParams?.inviteId;
  const emailParam = resolvedSearchParams?.email;

  // If there's an inviteId, fetch invitation details to display context
  // Also check for pending invitations by email
  let invitationContext: { teamName: string; role: string } | null = null;

  if (inviteId) {
    const inviteNum = parseInt(inviteId);
    if (!isNaN(inviteNum)) {
      const [invitation] = await db
        .select({
          role: invitations.role,
          teamName: teams.name,
        })
        .from(invitations)
        .innerJoin(teams, eq(invitations.teamId, teams.id))
        .where(
          and(
            eq(invitations.id, inviteNum),
            eq(invitations.status, 'pending')
          )
        )
        .limit(1);

      if (invitation) {
        invitationContext = {
          teamName: invitation.teamName,
          role: invitation.role,
        };
      }
    }
  } else if (emailParam) {
    // Check for pending invitation by email
    const [invitation] = await db
      .select({
        role: invitations.role,
        teamName: teams.name,
      })
      .from(invitations)
      .innerJoin(teams, eq(invitations.teamId, teams.id))
      .where(
        and(
          eq(invitations.email, emailParam),
          eq(invitations.status, 'pending')
        )
      )
      .limit(1);

    if (invitation) {
      invitationContext = {
        teamName: invitation.teamName,
        role: invitation.role,
      };
    }
  }

  return (
    <Suspense>
      <Login mode="signup" invitationContext={invitationContext} />
    </Suspense>
  );
}
