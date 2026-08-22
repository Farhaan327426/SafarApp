"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const VECHICLE_FARES = [
    { vehicleType: 'MINI_BUS', vehicleCategory: 'BUS', fareBasis: 'DISTANCE_SLAB', effectiveFrom: new Date(), sourceAuthority: 'J&K Transport Department', sourceNotification: 'SRO-97', verificationStatus: 'VERIFIED' },
    { vehicleType: 'BIG_BUS', vehicleCategory: 'BUS', fareBasis: 'DISTANCE_SLAB', effectiveFrom: new Date(), sourceAuthority: 'J&K Transport Department', sourceNotification: 'SRO-97', verificationStatus: 'VERIFIED' },
    { vehicleType: 'TATA_MAGIC', vehicleCategory: 'VAN', fareBasis: 'DISTANCE_SLAB', effectiveFrom: new Date(), sourceAuthority: 'J&K Transport Department', sourceNotification: 'SRO-97', verificationStatus: 'VERIFIED' },
    { vehicleType: 'SHARED_VAN', vehicleCategory: 'VAN', fareBasis: 'DISTANCE_SLAB', effectiveFrom: new Date(), sourceAuthority: 'J&K Transport Department', sourceNotification: 'SRO-97', verificationStatus: 'VERIFIED' },
    { vehicleType: 'E_RICKSHAW', vehicleCategory: 'EV', fareBasis: 'DISTANCE_SLAB', effectiveFrom: new Date(), sourceAuthority: 'J&K Transport Department', sourceNotification: 'EV-97', verificationStatus: 'VERIFIED' },
    { vehicleType: 'E_AUTO', vehicleCategory: 'EV', fareBasis: 'DISTANCE_SLAB', effectiveFrom: new Date(), sourceAuthority: 'J&K Transport Department', sourceNotification: 'EV-97', verificationStatus: 'VERIFIED' },
    { vehicleType: 'PETROL_AUTO', vehicleCategory: 'AUTO', fareBasis: 'DISTANCE_SLAB', effectiveFrom: new Date(), sourceAuthority: 'J&K Transport Department', sourceNotification: 'SRO-97', verificationStatus: 'VERIFIED' },
    { vehicleType: 'TAXI_MAXI_CAB_BASE', vehicleCategory: 'TAXI', fareBasis: 'DISTANCE_SLAB', effectiveFrom: new Date(), sourceAuthority: 'J&K Transport Department', sourceNotification: 'SRO-97', verificationStatus: 'VERIFIED' },
    { vehicleType: 'TAXI_MEDIUM_TOURIST', vehicleCategory: 'TAXI', fareBasis: 'DISTANCE_SLAB', effectiveFrom: new Date(), sourceAuthority: 'J&K Transport Department', sourceNotification: 'SRO-97', verificationStatus: 'REVIEW_REQUIRED' },
    { vehicleType: 'TAXI_PREMIUM_TOURIST', vehicleCategory: 'TAXI', fareBasis: 'DISTANCE_SLAB', effectiveFrom: new Date(), sourceAuthority: 'J&K Transport Department', sourceNotification: 'SRO-97', verificationStatus: 'REVIEW_REQUIRED' }
];
async function main() {
    console.log('Seeding fare rules with upsert...');
    for (const fare of VECHICLE_FARES) {
        try {
            const existing = await prisma.fareRule.findFirst({
                where: {
                    vehicleType: fare.vehicleType,
                    sourceAuthority: fare.sourceAuthority,
                }
            });
            if (existing) {
                await prisma.fareRule.update({
                    where: { id: existing.id },
                    data: { ...fare, updatedAt: new Date() }
                });
            }
            else {
                await prisma.fareRule.create({
                    data: fare
                });
            }
            console.log(`Upserted rule for ${fare.vehicleType}`);
        }
        catch (e) {
            console.error(`Failed to upsert ${fare.vehicleType}: ${e.message}`);
        }
    }
    console.log('Fare rules seeded successfully.');
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
