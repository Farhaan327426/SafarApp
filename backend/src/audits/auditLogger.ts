import { prisma } from '../config/db';

export interface AuditLogParams {
  actorId?: string;
  actorRole?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  requestId?: string;
}

export async function logAuditEvent(
  actorIdOrParams: string | AuditLogParams,
  action?: string,
  resourceType?: string,
  resourceId?: string,
  metadata?: any,
  requestId?: string
) {
  let params: AuditLogParams;

  if (typeof actorIdOrParams === 'object') {
    params = actorIdOrParams;
  } else {
    params = {
      actorId: actorIdOrParams,
      action: action || 'UNKNOWN_ACTION',
      resourceType: resourceType || 'UNKNOWN_RESOURCE',
      resourceId: resourceId || undefined,
      metadata,
      requestId
    };
  }

  const {
    actorId,
    actorRole,
    action: evtAction,
    resourceType: evtResourceType,
    resourceId: evtResourceId,
    oldValue,
    newValue,
    ipAddress,
    userAgent,
    metadata: evtMetadata,
    requestId: evtRequestId
  } = params;

  const logPayload = {
    timestamp: new Date().toISOString(),
    actorId: actorId || 'ANONYMOUS',
    actorRole: actorRole || 'UNKNOWN',
    action: evtAction,
    resourceType: evtResourceType,
    resourceId: evtResourceId || null,
    ipAddress: ipAddress || 'N/A',
    userAgent: userAgent || 'N/A',
    requestId: evtRequestId || 'N/A',
    details: evtMetadata || (oldValue || newValue ? { oldValue, newValue } : null)
  };

  console.log(`[AUDIT_LOG] ${JSON.stringify(logPayload)}`);

  try {
    if (actorId) {
      await prisma.auditLog.create({
        data: {
          actorId,
          action: evtAction,
          resourceType: evtResourceType,
          resourceId: evtResourceId || null,
          metadata: evtMetadata ? JSON.parse(JSON.stringify(evtMetadata)) : (oldValue || newValue ? JSON.parse(JSON.stringify({ oldValue, newValue })) : null),
          requestId: evtRequestId || null
        }
      });
    }
  } catch (error) {
    console.error('[AUDIT_LOG_ERROR] Failed to persist audit record to database:', error);
  }
}
