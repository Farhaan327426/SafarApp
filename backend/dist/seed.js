"use strict";
/**
 * DEVELOPMENT DATA SEED SCRIPT
 * Populates initial default users and active fare configuration in PostgreSQL.
 * NEVER RUN THIS IN PRODUCTION ENVIRONMENT.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const argon2_1 = __importDefault(require("argon2"));
const db_1 = require("./config/db");
async function seed() {
    console.log('🌱 Starting Safar Development Data Seed...');
    // Hash default admin password with Argon2id
    const adminPasswordHash = await argon2_1.default.hash('srta@admin2026');
    const auditorPasswordHash = await argon2_1.default.hash('auditor@2026');
    // Seed Admin User
    const adminUser = await db_1.prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            fullName: 'Chief Transport Administrator',
            role: 'SUPER_ADMIN',
            passwordHash: adminPasswordHash,
            isActive: true
        }
    });
    // Seed Auditor User
    const auditorUser = await db_1.prisma.user.upsert({
        where: { username: 'auditor' },
        update: {},
        create: {
            username: 'auditor',
            fullName: 'Regional Transport Compliance Auditor',
            role: 'AUDITOR',
            passwordHash: auditorPasswordHash,
            isActive: true
        }
    });
    // Seed Default Published Fare Version
    const defaultFare = await db_1.prisma.fareVersion.upsert({
        where: { version: 20260801 },
        update: {},
        create: {
            version: 20260801,
            status: 'PUBLISHED',
            reason: 'Initial Transport Commission Fare Schedule 2026',
            rates: {
                Kashmir: { plain: 1.40, hilly: 1.70 },
                Jammu: { plain: 1.35, hilly: 1.65 }
            },
            slabs: { 3: 9, 5: 14, 10: 17, 15: 20, 20: 26 },
            vehicleMultipliers: { minibus: 1.0, tatamagic: 1.10, sharedvan: 1.15 },
            publishedById: adminUser.id,
            publishedAt: new Date()
        }
    });
    // Seed Official J&K Transport Fare Sources
    const source2026 = await db_1.prisma.fareSource.upsert({
        where: { notificationNumber: 'Notification No. 01-P-MVD of 2026' },
        update: {},
        create: {
            authority: 'State Transport Authority, J&K',
            notificationNumber: 'Notification No. 01-P-MVD of 2026',
            notificationDate: new Date('2026-04-30'),
            effectiveDate: new Date('2026-04-30'),
            title: 'Passenger Fare Revision Order 2026 (18% Hike)',
            sourceUrl: 'https://jk.gov.in/mvd/notifications/2026/01-P-MVD',
            referenceNotes: 'Official passenger fare revision order for buses, mini buses, taxis, maxi cabs',
            verificationStatus: 'VERIFIED'
        }
    });
    const source2021 = await db_1.prisma.fareSource.upsert({
        where: { notificationNumber: 'Notification No. 01-P-MVD of 2021' },
        update: {},
        create: {
            authority: 'State Transport Authority, J&K',
            notificationNumber: 'Notification No. 01-P-MVD of 2021',
            notificationDate: new Date('2021-03-19'),
            effectiveDate: new Date('2021-03-19'),
            title: 'Passenger Fare Notification 2021',
            sourceUrl: 'https://jk.gov.in/mvd/notifications/2021/01-P-MVD',
            referenceNotes: 'Maximum chargeable passenger fares for stage carriages, mini-buses, auto rickshaws',
            verificationStatus: 'VERIFIED'
        }
    });
    // Seed Official Fare Rules
    const initialRules = [
        {
            sourceId: source2026.id,
            vehicleType: 'bigbus',
            vehicleCategory: 'BIG_BUS',
            region: 'all',
            terrain: 'all',
            fareBasis: 'DISTANCE_SLAB',
            perKmRate: 1.65,
            effectiveFrom: new Date('2026-04-30'),
            sourceAuthority: 'State Transport Authority, J&K',
            sourceNotification: 'Notification No. 01-P-MVD of 2026',
            sourceDate: new Date('2026-04-30'),
            sourceUrl: 'https://jk.gov.in/mvd/notifications/2026/01-P-MVD',
            sourceReference: 'Annexure A-II',
            verificationStatus: 'VERIFIED'
        },
        {
            sourceId: source2026.id,
            vehicleType: 'mediumbus',
            vehicleCategory: 'MEDIUM_BUS',
            region: 'all',
            terrain: 'all',
            fareBasis: 'DISTANCE_SLAB',
            perKmRate: 1.65,
            effectiveFrom: new Date('2026-04-30'),
            sourceAuthority: 'State Transport Authority, J&K',
            sourceNotification: 'Notification No. 01-P-MVD of 2026',
            sourceDate: new Date('2026-04-30'),
            sourceUrl: 'https://jk.gov.in/mvd/notifications/2026/01-P-MVD',
            sourceReference: 'Annexure A-II',
            verificationStatus: 'VERIFIED'
        },
        {
            sourceId: source2026.id,
            vehicleType: 'minibus',
            vehicleCategory: 'MINI_BUS',
            region: 'all',
            terrain: 'all',
            fareBasis: 'DISTANCE_SLAB',
            perKmRate: 1.65,
            effectiveFrom: new Date('2026-04-30'),
            sourceAuthority: 'State Transport Authority, J&K',
            sourceNotification: 'Notification No. 01-P-MVD of 2026',
            sourceDate: new Date('2026-04-30'),
            sourceUrl: 'https://jk.gov.in/mvd/notifications/2026/01-P-MVD',
            sourceReference: 'Annexure A-II',
            verificationStatus: 'VERIFIED'
        },
        {
            sourceId: source2026.id,
            vehicleType: 'maxicab',
            vehicleCategory: 'TAXI_MAXI_CAB_BASE',
            region: 'all',
            terrain: 'all',
            fareBasis: 'PER_KM',
            perKmRate: 14.50,
            effectiveFrom: new Date('2026-04-30'),
            sourceAuthority: 'State Transport Authority, J&K',
            sourceNotification: 'Notification No. 01-P-MVD of 2026',
            sourceDate: new Date('2026-04-30'),
            sourceUrl: 'https://jk.gov.in/mvd/notifications/2026/01-P-MVD',
            sourceReference: 'Annexure C-I',
            verificationStatus: 'VERIFIED'
        },
        {
            sourceId: source2026.id,
            vehicleType: 'tavera',
            vehicleCategory: 'TAXI_MEDIUM_TOURIST',
            region: 'all',
            terrain: 'all',
            fareBasis: 'PER_KM',
            perKmRate: 18.00,
            effectiveFrom: new Date('2026-04-30'),
            sourceAuthority: 'State Transport Authority, J&K',
            sourceNotification: 'Notification No. 01-P-MVD of 2026',
            sourceDate: new Date('2026-04-30'),
            sourceUrl: 'https://jk.gov.in/mvd/notifications/2026/01-P-MVD',
            sourceReference: 'Annexure C-Ia',
            verificationStatus: 'VERIFIED'
        },
        {
            sourceId: source2026.id,
            vehicleType: 'innova',
            vehicleCategory: 'TAXI_PREMIUM_TOURIST',
            region: 'all',
            terrain: 'all',
            fareBasis: 'PER_KM',
            perKmRate: 24.00,
            effectiveFrom: new Date('2026-04-30'),
            sourceAuthority: 'State Transport Authority, J&K',
            sourceNotification: 'Notification No. 01-P-MVD of 2026',
            sourceDate: new Date('2026-04-30'),
            sourceUrl: 'https://jk.gov.in/mvd/notifications/2026/01-P-MVD',
            sourceReference: 'Annexure C-Ia(1)',
            verificationStatus: 'VERIFIED'
        },
        {
            sourceId: source2021.id,
            vehicleType: 'petrolauto',
            vehicleCategory: 'PETROL_AUTO',
            region: 'all',
            terrain: 'all',
            fareBasis: 'METERED',
            firstKmRate: 25.00,
            subsequentKmRate: 15.00,
            effectiveFrom: new Date('2021-03-19'),
            sourceAuthority: 'State Transport Authority, J&K',
            sourceNotification: 'Notification No. 01-P-MVD of 2021',
            sourceDate: new Date('2021-03-19'),
            sourceUrl: 'https://jk.gov.in/mvd/notifications/2021/01-P-MVD',
            sourceReference: 'Annexure B-I',
            verificationStatus: 'VERIFIED'
        },
        {
            sourceId: source2026.id,
            vehicleType: 'tatamagic',
            vehicleCategory: 'TATA_MAGIC',
            region: 'all',
            terrain: 'all',
            fareBasis: 'DISTANCE_SLAB',
            perKmRate: 1.80,
            effectiveFrom: new Date('2026-04-30'),
            sourceAuthority: 'State Transport Authority, J&K',
            sourceNotification: 'Notification No. 01-P-MVD of 2026',
            sourceDate: new Date('2026-04-30'),
            sourceUrl: 'https://jk.gov.in/mvd/notifications/2026/01-P-MVD',
            sourceReference: 'Annexure A-III',
            verificationStatus: 'VERIFIED'
        },
        {
            vehicleType: 'erickshaw',
            vehicleCategory: 'E_RICKSHAW',
            region: 'all',
            terrain: 'plain',
            fareBasis: 'PER_KM',
            perKmRate: 15.00,
            effectiveFrom: new Date('2026-04-30'),
            sourceAuthority: 'Transport Department J&K (Unverified Draft)',
            sourceNotification: 'Unverified Order',
            sourceDate: new Date('2026-04-30'),
            sourceReference: 'Pending Gazette Verification',
            verificationStatus: 'REVIEW_REQUIRED'
        },
        {
            vehicleType: 'eauto',
            vehicleCategory: 'E_AUTO',
            region: 'all',
            terrain: 'plain',
            fareBasis: 'METERED',
            firstKmRate: 25.00,
            subsequentKmRate: 20.00,
            effectiveFrom: new Date('2026-04-30'),
            sourceAuthority: 'Transport Department J&K (Unverified Draft)',
            sourceNotification: 'Unverified Order',
            sourceDate: new Date('2026-04-30'),
            sourceReference: 'Pending Gazette Verification',
            verificationStatus: 'REVIEW_REQUIRED'
        }
    ];
    for (const rule of initialRules) {
        const existing = await db_1.prisma.fareRule.findFirst({
            where: {
                vehicleType: rule.vehicleType,
                vehicleCategory: rule.vehicleCategory,
                sourceNotification: rule.sourceNotification
            }
        });
        if (existing) {
            await db_1.prisma.fareRule.update({
                where: { id: existing.id },
                data: { ...rule, updatedAt: new Date() }
            });
        }
        else {
            await db_1.prisma.fareRule.create({ data: rule });
        }
    }
    // Seed Routes
    const sampleRoutes = [
        { routeNumber: 'JK-01', origin: 'Srinagar', destination: 'Baramulla', distanceKm: 54.0, region: 'Kashmir', terrain: 'Plain' },
        { routeNumber: 'JK-02', origin: 'Srinagar', destination: 'Anantnag', distanceKm: 52.0, region: 'Kashmir', terrain: 'Plain' },
        { routeNumber: 'JK-03', origin: 'Srinagar', destination: 'Gulmarg', distanceKm: 51.0, region: 'Kashmir', terrain: 'Hilly' },
        { routeNumber: 'JK-04', origin: 'Jammu', destination: 'Katra', distanceKm: 45.0, region: 'Jammu', terrain: 'Hilly' }
    ];
    // ─── JKMT ACT NOTIFIED ROUTES ───────────────────────────────────────────────
    const jkmtRoutes = [
        { routeNumber: 'JKMT-01', origin: 'Srinagar', destination: 'Jammu', distanceKm: 268.0, region: 'Inter-Division', terrain: 'Hilly', isJkmtNotified: true, jkmtNotificationRef: 'SRO-158/2023', routeCategory: 'STAGE_CARRIAGE' },
        { routeNumber: 'JKMT-02', origin: 'Srinagar', destination: 'Leh', distanceKm: 434.0, region: 'Ladakh Corridor', terrain: 'Hilly', isJkmtNotified: true, jkmtNotificationRef: 'SRO-158/2023', routeCategory: 'STAGE_CARRIAGE' },
        { routeNumber: 'JKMT-03', origin: 'Srinagar', destination: 'Gulmarg', distanceKm: 56.0, region: 'Kashmir', terrain: 'Hilly', isJkmtNotified: true, jkmtNotificationRef: 'SRO-492/2022', routeCategory: 'TOURIST_CIRCUIT' },
        { routeNumber: 'JKMT-04', origin: 'Srinagar', destination: 'Pahalgam', distanceKm: 95.0, region: 'Kashmir', terrain: 'Hilly', isJkmtNotified: true, jkmtNotificationRef: 'SRO-492/2022', routeCategory: 'TOURIST_CIRCUIT' },
        { routeNumber: 'JKMT-05', origin: 'Srinagar', destination: 'Sonamarg', distanceKm: 80.0, region: 'Kashmir', terrain: 'Hilly', isJkmtNotified: true, jkmtNotificationRef: 'SRO-492/2022', routeCategory: 'TOURIST_CIRCUIT' },
        { routeNumber: 'JKMT-06', origin: 'Srinagar', destination: 'Baramulla', distanceKm: 60.0, region: 'Kashmir', terrain: 'Plain', isJkmtNotified: true, jkmtNotificationRef: 'SO-354/2021', routeCategory: 'STAGE_CARRIAGE' },
        { routeNumber: 'JKMT-07', origin: 'Srinagar', destination: 'Kupwara', distanceKm: 100.0, region: 'Kashmir', terrain: 'Plain', isJkmtNotified: true, jkmtNotificationRef: 'SO-354/2021', routeCategory: 'STAGE_CARRIAGE' },
        { routeNumber: 'JKMT-08', origin: 'Srinagar', destination: 'Anantnag', distanceKm: 55.0, region: 'Kashmir', terrain: 'Plain', isJkmtNotified: true, jkmtNotificationRef: 'SO-354/2021', routeCategory: 'STAGE_CARRIAGE' },
        { routeNumber: 'JKMT-09', origin: 'Jammu', destination: 'Patnitop', distanceKm: 112.0, region: 'Jammu', terrain: 'Hilly', isJkmtNotified: true, jkmtNotificationRef: 'SRO-158/2023', routeCategory: 'STAGE_CARRIAGE' },
        { routeNumber: 'JKMT-10', origin: 'Anantnag', destination: 'Pahalgam', distanceKm: 28.0, region: 'Kashmir', terrain: 'Hilly', isJkmtNotified: true, jkmtNotificationRef: 'SO-354/2021', routeCategory: 'STAGE_CARRIAGE' },
        { routeNumber: 'JKMT-11', origin: 'Jammu', destination: 'Udhampur', distanceKm: 68.0, region: 'Jammu', terrain: 'Plain', isJkmtNotified: true, jkmtNotificationRef: 'SRO-158/2023', routeCategory: 'STAGE_CARRIAGE' },
        { routeNumber: 'JKMT-12', origin: 'Srinagar', destination: 'Shopian', distanceKm: 62.0, region: 'Kashmir', terrain: 'Plain', isJkmtNotified: true, jkmtNotificationRef: 'SO-354/2021', routeCategory: 'STAGE_CARRIAGE' },
    ];
    for (const route of jkmtRoutes) {
        await db_1.prisma.route.upsert({
            where: { routeNumber: route.routeNumber },
            update: {
                isJkmtNotified: route.isJkmtNotified,
                jkmtNotificationRef: route.jkmtNotificationRef,
                routeCategory: route.routeCategory,
            },
            create: {
                ...route,
                isActive: true,
            },
        });
    }
    console.log(`✓ JKMT routes seeded: ${jkmtRoutes.length}`);
    // ─── ACTIVE SRO FARE SOURCES ────────────────────────────────────────────────
    const sroSources = [
        {
            title: 'Stage Carriage Fare Notification SRO-158',
            authority: 'Transport Commissioner J&K',
            notificationNumber: 'SRO-158/2023',
            notificationDate: new Date('2023-04-01'),
            effectiveDate: new Date('2023-04-01'),
            sroCode: 'SRO-158',
            isActiveSro: true,
            vehicleCategoryScope: 'STAGE_CARRIAGE',
            verificationStatus: 'VERIFIED',
        },
        {
            title: 'Tourist Vehicle Fare Notification SRO-492',
            authority: 'Transport Commissioner J&K',
            notificationNumber: 'SRO-492/2022',
            notificationDate: new Date('2022-09-15'),
            effectiveDate: new Date('2022-09-15'),
            sroCode: 'SRO-492',
            isActiveSro: true,
            vehicleCategoryScope: 'TOURIST_PERMIT',
            verificationStatus: 'VERIFIED',
        },
        {
            title: 'Inter-District Stage Carriage SO-354',
            authority: 'Divisional Commissioner Kashmir',
            notificationNumber: 'SO-354/2021',
            notificationDate: new Date('2021-07-01'),
            effectiveDate: new Date('2021-07-01'),
            sroCode: 'SO-354',
            isActiveSro: true,
            vehicleCategoryScope: 'STAGE_CARRIAGE',
            verificationStatus: 'VERIFIED',
        },
        {
            title: 'Intra-City Fare Schedule SO-112',
            authority: 'Regional Transport Officer Srinagar',
            notificationNumber: 'SO-112/2021',
            notificationDate: new Date('2021-03-10'),
            effectiveDate: new Date('2021-03-10'),
            sroCode: 'SO-112',
            isActiveSro: true,
            vehicleCategoryScope: 'STAGE_CARRIAGE',
            verificationStatus: 'VERIFIED',
        },
    ];
    for (const src of sroSources) {
        await db_1.prisma.fareSource.upsert({
            where: { notificationNumber: src.notificationNumber },
            update: { isActiveSro: true, sroCode: src.sroCode, vehicleCategoryScope: src.vehicleCategoryScope },
            create: src,
        });
    }
    console.log(`✓ SRO fare sources seeded: ${sroSources.length}`);
    // ─── TEST NON-LOCAL PERMITS (3 scenarios) ───────────────────────────────────
    const laknaurRoute = await db_1.prisma.route.findFirst({
        where: { routeNumber: 'JKMT-01' }
    });
    const banihRoute = await db_1.prisma.route.findFirst({
        where: { routeNumber: 'JKMT-09' }
    });
    const testPermits = [
        {
            // Scenario A: Active verified permit — tests successful lookup
            permitNumber: 'JK/NLP/2026/PB/001',
            vehicleRegistration: 'PB-08-AB-1234',
            operatorName: 'Punjab State Roadways',
            homeState: 'PB',
            homeStateRegExpiry: new Date('2027-06-30'),
            vehicleCategory: 'STAGE_CARRIAGE_PERMIT',
            permittedRouteId: laknaurRoute?.id ?? null,
            permittedCorridorDescription: 'Lakhanpur to Srinagar via NH-44',
            entryBorderPost: 'Lakhanpur',
            inspectionCheckpoint: 'Lakhanpur Barrier Naaka',
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 90 * 86400000),
            challanNumber: 'JK/CHAL/2026/PB/001',
            taxFeeAmount: 2500.00,
            taxFeePaidDate: new Date(),
            verificationStatus: 'VERIFIED',
            issuedByAuthority: 'Regional Transport Officer, Jammu',
        },
        {
            // Scenario B: Pending permit — tests approval flow
            permitNumber: 'JK/NLP/2026/HP/001',
            vehicleRegistration: 'HP-03-CD-5678',
            operatorName: 'Himachal Road Transport Corporation',
            homeState: 'HP',
            homeStateRegExpiry: new Date('2027-03-31'),
            vehicleCategory: 'CONTRACT_CARRIAGE_PERMIT',
            permittedRouteId: banihRoute?.id ?? null,
            permittedCorridorDescription: 'Banihal to Srinagar via NH-44',
            entryBorderPost: 'Banihal Tunnel',
            inspectionCheckpoint: 'Banihal Toll Plaza',
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 30 * 86400000),
            challanNumber: 'JK/CHAL/2026/HP/001',
            taxFeeAmount: 1800.00,
            taxFeePaidDate: new Date(),
            verificationStatus: 'PENDING', // awaits approval
            issuedByAuthority: 'Regional Transport Officer, Ramban',
        },
        {
            // Scenario C: Past valid_until — trigger sets EXPIRED on INSERT
            permitNumber: 'JK/NLP/2025/DL/001',
            vehicleRegistration: 'DL-01-EF-9012',
            operatorName: 'Delhi Transport Corporation',
            homeState: 'DL',
            homeStateRegExpiry: new Date('2026-12-31'),
            vehicleCategory: 'ALL_INDIA_TOURIST_PERMIT',
            permittedRouteId: null,
            permittedCorridorDescription: 'Lakhanpur to Srinagar via NH-44',
            entryBorderPost: 'Lakhanpur',
            inspectionCheckpoint: 'Lakhanpur Barrier Naaka',
            validFrom: new Date('2025-01-01'),
            validUntil: new Date('2025-06-30'), // past — trigger sets EXPIRED
            challanNumber: 'JK/CHAL/2025/DL/001',
            taxFeeAmount: 3200.00,
            taxFeePaidDate: new Date('2025-01-01'),
            verificationStatus: 'EXPIRED',
            issuedByAuthority: 'Regional Transport Officer, Jammu',
        },
    ];
    for (const permit of testPermits) {
        await db_1.prisma.nonLocalPermit.upsert({
            where: { permitNumber: permit.permitNumber },
            update: {},
            create: permit,
        });
    }
    console.log(`✓ Test permits seeded: ${testPermits.length} (VERIFIED, PENDING, EXPIRED)`);
    console.log('✅ Development data seeding completed successfully!');
    console.log(`- Created Admin User: admin (ID: ${adminUser.id})`);
    console.log(`- Created Auditor User: auditor (ID: ${auditorUser.id})`);
    console.log(`- Created Fare Version: v${defaultFare.version}`);
    console.log(`- Seeded ${initialRules.length} Official J&K Fare Rules with Provenance Tracking.`);
    console.log(`- Created ${sampleRoutes.length + jkmtRoutes.length} transit routes.`);
}
seed()
    .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await db_1.prisma.$disconnect();
});
