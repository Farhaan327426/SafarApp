"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moneyToPaisa = moneyToPaisa;
exports.paisaToRupees = paisaToRupees;
exports.addPaisa = addPaisa;
exports.multiplyPaisa = multiplyPaisa;
exports.percentagePaisa = percentagePaisa;
exports.roundPaisa = roundPaisa;
/**
 * Converts a rupee amount (e.g. 14.50) to integer paisa (1450).
 */
function moneyToPaisa(amountRupees) {
    const amount = typeof amountRupees === 'string' ? parseFloat(amountRupees) : amountRupees;
    return Math.round(amount * 100);
}
/**
 * Converts integer paisa (1450) to rupee string ("14.50").
 */
function paisaToRupees(amountPaisa) {
    return (Math.round(amountPaisa) / 100).toFixed(2);
}
/**
 * Adds two integer paisa amounts together.
 */
function addPaisa(amount1, amount2) {
    return Math.round(amount1) + Math.round(amount2);
}
/**
 * Multiplies a paisa amount by a multiplier (e.g., distance).
 */
function multiplyPaisa(amountPaisa, multiplier, mode = 'HALF_UP') {
    const result = amountPaisa * multiplier;
    return roundPaisa(result, mode);
}
/**
 * Calculates a percentage of a paisa amount.
 */
function percentagePaisa(amountPaisa, percentage, mode = 'HALF_UP') {
    const result = (amountPaisa * percentage) / 100;
    return roundPaisa(result, mode);
}
/**
 * Rounds a raw paisa value to an integer using the specified rounding mode.
 */
function roundPaisa(amountPaisa, mode = 'HALF_UP') {
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
