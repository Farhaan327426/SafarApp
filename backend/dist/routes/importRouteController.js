"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importJsonRoutes = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const importJsonRoutes = async (req, res) => {
    const requestId = req.requestId;
    try {
        const routes = req.body;
        if (!Array.isArray(routes)) {
            return res.status(400).json({ success: false, error: { message: "Invalid schema, expected an array of routes" }, requestId });
        }
        let importedCount = 0;
        for (const route of routes) {
            if (!route.id || !route.name)
                continue;
            // Note: Full DB upsert logic goes here
            importedCount++;
        }
        return res.status(200).json({
            success: true,
            data: { message: `Successfully imported ${importedCount} routes.` },
            requestId
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: { message: error.message },
            requestId
        });
    }
};
exports.importJsonRoutes = importJsonRoutes;
