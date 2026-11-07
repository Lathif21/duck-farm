import { describe, expect, it } from 'vitest';
import {
	duckTotal,
	formatDots,
	formatKg,
	formatMoneyTyping,
	formatRupiah,
	formatSignedRupiah,
	gramsToKgInput,
	lineTotal,
	parseKgToGrams,
	parseQuantity,
	parseRupiah,
	quantityToInput
} from './money';

describe('parseRupiah (R-F1)', () => {
	it.each([
		['1.500.000', 1500000],
		['1500000', 1500000],
		['Rp 1.500.000', 1500000],
		['rp1.500.000', 1500000],
		['  450.000 ', 450000]
	])('parses %s', (input, expected) => {
		expect(parseRupiah(input)).toBe(expected);
	});

	it.each(['1,5', '', 'abc', '1.5.', '-500', '12a'])('rejects %s', (input) => {
		expect(parseRupiah(input)).toBeNull();
	});
});

describe('formatting (R-F1, R-F2, R-F4)', () => {
	it('formats rupiah with dot separators', () => {
		expect(formatRupiah(1500000)).toBe('Rp 1.500.000');
		expect(formatRupiah(0)).toBe('Rp 0');
		expect(formatDots(450000)).toBe('450.000');
	});

	it('signs income and expense', () => {
		expect(formatSignedRupiah(900000, 'IN')).toBe('+ Rp 900.000');
		expect(formatSignedRupiah(900000, 'OUT')).toBe('− Rp 900.000');
	});

	it('formats kg with comma decimals', () => {
		expect(formatKg(95500)).toBe('95,5 Kg');
		expect(formatKg(95000)).toBe('95 Kg');
		expect(formatKg(1234500)).toBe('1.234,5 Kg');
		expect(gramsToKgInput(95500)).toBe('95,5');
	});
});

describe('parseKgToGrams (R-F2)', () => {
	it.each([
		['95', 95000],
		['95,5', 95500],
		['95.5', 95500],
		['0,9', 900],
		['0,25', 250]
	])('parses %s', (input, expected) => {
		expect(parseKgToGrams(input)).toBe(expected);
	});

	it.each(['', '0', '95,555', 'a', '-1', '1,2,3'])('rejects %s', (input) => {
		expect(parseKgToGrams(input)).toBeNull();
	});
});

describe('parseQuantity (R-SH5)', () => {
	it.each([
		['2', 200],
		['2,5', 250],
		['2.5', 250],
		['0,01', 1]
	])('parses %s to hundredths', (input, expected) => {
		expect(parseQuantity(input)).toBe(expected);
	});

	it.each(['', '0', '2,555', 'x', '-2'])('rejects %s', (input) => {
		expect(parseQuantity(input)).toBeNull();
	});

	it('round-trips to an input string', () => {
		expect(quantityToInput(250)).toBe('2,5');
		expect(quantityToInput(200)).toBe('2');
	});
});

describe('totals (money-and-stock rules, R-S1)', () => {
	it('lineTotal = round(quantity × unitPrice)', () => {
		expect(lineTotal(200, 450000)).toBe(900000); // 2 × 450.000
		expect(lineTotal(250, 13000)).toBe(32500); // 2,5 × 13.000
		expect(lineTotal(133, 1001)).toBe(1331); // 1,33 × 1.001 = 1331,33 → 1331
		expect(lineTotal(150, 1001)).toBe(1502); // 1,5 × 1.001 = 1501,5 → 1502 (half up)
	});

	it('duckTotal = round(grams × pricePerKg / 1000)', () => {
		expect(duckTotal(95000, 38000)).toBe(3610000);
		expect(duckTotal(95500, 38000)).toBe(3629000);
		expect(duckTotal(38000, 45000)).toBe(1710000);
	});
});

describe('formatMoneyTyping (R-F1: live dots, caret kept)', () => {
	it('typing 450000 shows 450.000 with the caret at the end', () => {
		expect(formatMoneyTyping('450000', 6)).toEqual({ text: '450.000', caret: 7 });
	});

	it('editing a middle digit keeps the caret after that digit', () => {
		// "45|0.000" → type "1" → "451|0.000" → "4.51|0.000"
		expect(formatMoneyTyping('4510.000', 3)).toEqual({ text: '4.510.000', caret: 4 });
		// delete the "5" in "4.5|10.000" → "4.|10.000" → "4|10.000"
		expect(formatMoneyTyping('4.10.000', 2)).toEqual({ text: '410.000', caret: 1 });
	});

	it('drops non-digits and leading zeros, keeps empty as empty', () => {
		expect(formatMoneyTyping('Rp 1,5', 6)).toEqual({ text: '15', caret: 2 });
		expect(formatMoneyTyping('007', 3)).toEqual({ text: '7', caret: 1 });
		expect(formatMoneyTyping('', 0)).toEqual({ text: '', caret: 0 });
	});
});
