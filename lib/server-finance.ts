import { coupleScopeId } from './finance';
import type { UserPayload } from './auth';
import { queryRows } from './db';

export async function getVisibleUserIds(session: UserPayload) {
  const scope = coupleScopeId(session);
  const coupleUsers = await queryRows<{ id: string }>(
    'select id from users where couple_id = $1',
    [scope],
  );

  return Array.from(new Set([session.id, ...coupleUsers.map((user) => user.id)]));
}
