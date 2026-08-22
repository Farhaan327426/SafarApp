export type RoundingMode = 'HALF_UP' | 'FLOOR' | 'CEIL';

/**
 * Converts a rupee amount (e.g. 14.50) to integer paisa (1450).
 */
export function moneyToPaisa(amountRupees: number | string): number {
    const amount = typeof amountRupees === 'string' ? parseFloat(amountRupees) : amountRupees;
    return Math.round(amount * 100);
}

/**
 * Converts integer paisa (1450) to rupee string ("14.50").
 */
export function paisaToRupees(amountPaisa: number): string {
    return (Math.round(amountPaisa) / 100).toFixed(2);
}

/**
 * Adds two integer paisa amounts together.
 */
export function addPaisa(amount1: number, amount2: number): number {
    return Math.round(amount1) + Math.round(amount2);
}

/**
 * Multiplies a paisa amount by a multiplier (e.g., distance).
 */
export function multiplyPaisa(amountPaisa: number, multiplier: number, mode: RoundingMode = 'HALF_UP'): number {
    const result = amountPaisa * multiplier;
    return roundPaisa(result, mode);
}

/**
 * Calculates a percentage of a paisa amount.
 */
export function percentagePaisa(amountPaisa: number, percentage: number, mode: RoundingMode = 'HALF_UP'): number {
    const result = (amountPaisa * percentage) / 100;
    return roundPaisa(result, mode);
}

/**
 * Rounds a raw paisa value to an integer using the specified rounding mode.
 */
export function roundPaisa(amountPaisa: number, mode: RoundingMode = 'HALF_UP'): number {
    switch (mode) {
        case 'CEIL':
            return Math.ceil(amountPaisa);
        case 'FLOOR':
            return Math.floor(amountPaisa);
        case 'HALF_UP':
        default:
            return Math.round(amountPaisa);
    }
}
