import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import type { AuditEvent, User } from '../types/index.js';

export function logAuditEvent(
  actor: { id: string; name: string; role: string },
  action: string,
  entityType: string,
  entityId: string,
  details: { beforeValue?: string; afterValue?: string; reason?: string }
): AuditEvent {
  const event: AuditEvent = {
    id: uuidv4(),
    actor_id: actor.id,
    actor_name: actor.name,
    actor_role: actor.role,
    action,
    entity_type: entityType,
    entity_id: entityId,
    before_value: details.beforeValue,
    after_value: details.afterValue,
    reason: details.reason,
    timestamp: new Date().toISOString(),
  };

  db.logAudit(event);
  return event;
}
