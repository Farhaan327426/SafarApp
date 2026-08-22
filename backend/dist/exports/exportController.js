"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportComplianceReport = exportComplianceReport;
const db_1 = require("../config/db");
const auditLogger_1 = require("../audits/auditLogger");
function sanitizeCsvCell(val) {
    if (val === null || val === undefined)
        return '""';
    let str = String(val);
    // Neutralize CSV formula injection characters: = + - @ \t \r
    if (/^[=+@\t\r-]/.test(str)) {
        str = "'" + str;
    }
    return `"${str.replace(/"/g, '""')}"`;
}
async function exportComplianceReport(req, res) {
    const user = req.user;
    const requestId = req.requestId;
    const format = req.query.format || 'json';
    try {
        const logs = await db_1.prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                actor: { select: { username: true, role: true } }
            }
        });
        await (0, auditLogger_1.logAuditEvent)(user.id, 'AUDIT_EXPORTED', 'EXPORT', 'compliance-report', { format }, requestId);
        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="safar_audit_export_${Date.now()}.csv"`);
            let csv = 'ID,Timestamp,Actor,Role,Action,ResourceType,ResourceID\n';
            for (const log of logs) {
                csv += [
                    sanitizeCsvCell(log.id),
                    sanitizeCsvCell(log.createdAt.toISOString()),
                    sanitizeCsvCell(log.actor.username),
                    sanitizeCsvCell(log.actor.role),
                    sanitizeCsvCell(log.action),
                    sanitizeCsvCell(log.resourceType),
                    sanitizeCsvCell(log.resourceId || '')
                ].join(',') + '\n';
            }
            return res.send(csv);
        }
        return res.json({
            success: true,
            data: logs,
            requestId
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: error.message },
            requestId
        });
    }
}
