import { TaxDetails, Country } from '../types'
import { TAX_CONFIGS, G_BASE } from '../taxConfig'

export const calculateTaxDetails = (
	yearlyWageNOK: string,
	pensionRate: number,
	deductionsNOK: string,
	country: Country = 'NO'
): TaxDetails => {
	const config = TAX_CONFIGS[country]
	const exchangeRate = config.exchangeRate

	// Convert inputs to local currency
	const grossNOK = parseFloat(yearlyWageNOK) || 0
	const userDeductionsNOK = parseFloat(deductionsNOK) || 0

	const grossYearly = grossNOK * exchangeRate
	const userDeductions = userDeductionsNOK * exchangeRate

	// 1. Pension (Employer OTP / Tjenestepensjon)
	let pensionBasis = grossYearly
	if (country === 'NO') {
		// Norway specific logic: Income > 1G and < 12G
		pensionBasis = Math.max(0, Math.min(grossYearly, 12 * G_BASE) - G_BASE)
	}

	const pensionCost = pensionBasis * (pensionRate / 100)

	// 2. Employer Tax (Arbeidsgiveravgift)
	// Usually on Gross + Pension
	// Denmark has basically 0, handled by rate = 0
	const agaBasis = grossYearly + pensionCost
	const agaCost = agaBasis * config.employerFeeRate

	// 3. Employee Tax
	// Standard Deductions
	let standardDeduction = 0
	if (config.standardDeductionRate > 0) {
		standardDeduction = grossYearly * config.standardDeductionRate
		if (config.standardDeductionMax > 0 && standardDeduction > config.standardDeductionMax) {
			standardDeduction = config.standardDeductionMax
		}
		if (
			config.standardDeductionMin > 0 &&
			standardDeduction < config.standardDeductionMin &&
			grossYearly > config.standardDeductionMin
		) {
			standardDeduction = config.standardDeductionMin
		}
		if (config.standardDeductionMin > 0 && grossYearly <= config.standardDeductionMin) {
			standardDeduction = grossYearly
		}
	}

	// General Income (Alminnelig inntekt / Taxable Income)
	// Gross - Standard Deductions - Personal Deductions (Interest etc from input + Standard Personal Allowance)
	const generalIncomeBase = grossYearly - standardDeduction - config.personalDeduction
	const generalIncome = Math.max(0, generalIncomeBase - userDeductions)

	const taxOnGeneralIncome = generalIncome * config.generalTaxRate

	// Social Security (Trygdeavgift / AM-bidrag)
	// Usually on Gross
	const trygdeavgift = grossYearly * config.socialSecurityRate

	// Bracket Tax (Trinnskatt / Statlig skatt / Topskat)
	// Based on Gross usually (or Specific Basis)
	// In DK, Topskat is after AM-bidrag, but for simplicity we use Gross here as approximation or adjust config limits
	// (Accurate DK calc: (Gross - AM-bidrag) > Limit)
	// Let's stick to Gross > Limit for generic implementation unless specific override needed.
	let trinnskatt = 0
	let bracketBasis = grossYearly

	if (country === 'DK') {
		// AM-bidrag is deducted before Topskat
		bracketBasis = grossYearly - trygdeavgift
	}

	for (let i = 0; i < config.brackets.length; i++) {
		const { limit: startLimit, rate } = config.brackets[i]
		const nextLimit = config.brackets[i + 1]?.limit || Infinity

		if (bracketBasis > startLimit) {
			const taxable = Math.min(bracketBasis, nextLimit) - startLimit
			trinnskatt += taxable * rate
		}
	}

	const totalEmployeeTax = taxOnGeneralIncome + trygdeavgift + trinnskatt
	const netYearly = grossYearly - totalEmployeeTax

	const totalStateRevenue = totalEmployeeTax + agaCost

	// Convert results back to NOK
	return {
		pensionCost: pensionCost / exchangeRate,
		agaCost: agaCost / exchangeRate,
		totalEmployerCost: (grossYearly + pensionCost + agaCost) / exchangeRate,
		totalEmployeeTax: totalEmployeeTax / exchangeRate,
		netYearly: netYearly / exchangeRate,
		trygdeavgift: trygdeavgift / exchangeRate,
		trinnskatt: trinnskatt / exchangeRate,
		taxOnGeneralIncome: taxOnGeneralIncome / exchangeRate,
		totalStateRevenue: totalStateRevenue / exchangeRate,
		generalIncome: generalIncome / exchangeRate
	}
}
