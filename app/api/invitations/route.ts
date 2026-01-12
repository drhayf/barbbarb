import { db } from '@/lib/db/drizzle';
import { invitations } from '@/lib/db/schema';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userWithTeam = await getUserWithTeam(user.id);
  if (!userWithTeam?.teamId) {
    return Response.json({ error: 'User is not part of a team' }, { status: 400 });
  }

  const pendingInvitations = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.teamId, userWithTeam.teamId),
        eq(invitations.status, 'pending')
      )
    )
    .orderBy(invitations.invitedAt);

  return Response.json(pendingInvitations);
}
