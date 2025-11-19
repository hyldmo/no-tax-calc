import { TaxDetails } from '../types'
import {
	G_BASE,
	AGA_RATE,
	TRYGDEAVGIFT_RATE,
	MINSTEFRADRAG_RATE,
	MINSTEFRADRAG_MAX,
	MINSTEFRADRAG_MIN,
	PERSONFRADRAG,
	GENERAL_TAX_RATE
} from '../data'

export const calculateTaxDetails = (yearlyWage: string, pensionRate: number, deductions: string): TaxDetails => {
	const grossYearly = parseFloat(yearlyWage) || 0
	const userDeductions = parseFloat(deductions) || 0

	// 1. Pension (Employer OTP)
	// Mandatory OTP is usually calculated on income > 1G and < 12G
	// Note: This is EMPLOYER contribution, does not affect employee taxable income immediately
	const pensionBasis = Math.max(0, Math.min(grossYearly, 12 * G_BASE) - G_BASE)
	const pensionCost = pensionBasis * (pensionRate / 100)

	// 2. Arbeidsgiveravgift (Employer Tax)
	// Calculated on Gross Salary + Pension Contribution
	const agaBasis = grossYearly + pensionCost
	const agaCost = agaBasis * AGA_RATE

	// 3. Employee Tax (Estimated)

	// Minstefradrag (Standard deduction)
	// Has floor and ceiling
	let minstefradrag = grossYearly * MINSTEFRADRAG_RATE
	if (minstefradrag > MINSTEFRADRAG_MAX) minstefradrag = MINSTEFRADRAG_MAX
	if (minstefradrag < MINSTEFRADRAG_MIN && grossYearly > MINSTEFRADRAG_MIN) minstefradrag = MINSTEFRADRAG_MIN
	if (grossYearly <= MINSTEFRADRAG_MIN) minstefradrag = grossYearly

	// Alminnelig inntekt (General Income)
	// Gross - Standard Deductions - Personal Deductions (Interest, IPS, Unions etc)
	const generalIncomeBase = grossYearly - minstefradrag - PERSONFRADRAG
	const generalIncome = Math.max(0, generalIncomeBase - userDeductions)

	const taxOnGeneralIncome = generalIncome * GENERAL_TAX_RATE

	// Trygdeavgift (Social Security) - Based on Gross (Personinntekt)
	const trygdeavgift = grossYearly * TRYGDEAVGIFT_RATE

	// Trinnskatt (Bracket Tax) - Based on Gross (Personinntekt)
	let trinnskatt = 0

	// Chunk 1: 208k - 292k
	if (grossYearly > 208050) {
		const limit = 292850
		const taxable = Math.min(grossYearly, limit) - 208050
		if (taxable > 0) trinnskatt += taxable * 0.017
	}
	if (grossYearly > 292850) {
		const limit = 670000
		const taxable = Math.min(grossYearly, limit) - 292850
		if (taxable > 0) trinnskatt += taxable * 0.04
	}
	if (grossYearly > 670000) {
		const limit = 937900
		const taxable = Math.min(grossYearly, limit) - 670000
		if (taxable > 0) trinnskatt += taxable * 0.136
	}
	if (grossYearly > 937900) {
		const limit = 1350000
		const taxable = Math.min(grossYearly, limit) - 937900
		if (taxable > 0) trinnskatt += taxable * 0.166
	}
	if (grossYearly > 1350000) {
		const taxable = grossYearly - 1350000
		trinnskatt += taxable * 0.176
	}

	const totalEmployeeTax = taxOnGeneralIncome + trygdeavgift + trinnskatt
	const netYearly = grossYearly - totalEmployeeTax

	// Total Tax Wedge (What the state gets in total)
	const totalStateRevenue = totalEmployeeTax + agaCost

	return {
		pensionCost,
		agaCost,
		totalEmployerCost: grossYearly + pensionCost + agaCost,
		totalEmployeeTax,
		netYearly,
		trygdeavgift,
		trinnskatt,
		taxOnGeneralIncome,
		totalStateRevenue,
		generalIncome
	}
}
