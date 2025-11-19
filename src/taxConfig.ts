export type Country = 'NO' | 'SE' | 'DK'

export interface TaxConfig {
	currency: string
	currencyName: string
	exchangeRate: number // Rate to convert NOK to local currency
	employerFeeRate: number // AGA / Arbetsgivaravgift
	socialSecurityRate: number // Trygdeavgift (Employee)
	standardDeductionRate: number // Minstefradrag
	standardDeductionMax: number
	standardDeductionMin: number
	personalDeduction: number // Personfradrag
	generalTaxRate: number
	brackets: { limit: number; rate: number }[]
}

export const TAX_CONFIGS: Record<Country, TaxConfig> = {
	NO: {
		currency: 'NOK',
		currencyName: 'Norske kroner',
		exchangeRate: 1,
		employerFeeRate: 0.141, // AGA
		socialSecurityRate: 0.078, // Trygdeavgift
		standardDeductionRate: 0.46, // Minstefradrag
		standardDeductionMax: 104450,
		standardDeductionMin: 31800,
		personalDeduction: 88250, // Personfradrag
		generalTaxRate: 0.22,
		brackets: [
			{ limit: 208050, rate: 0.017 },
			{ limit: 292850, rate: 0.04 },
			{ limit: 670000, rate: 0.136 },
			{ limit: 937900, rate: 0.166 },
			{ limit: 1350000, rate: 0.176 }
		]
	},
	SE: {
		currency: 'SEK',
		currencyName: 'Svenske kroner',
		exchangeRate: 0.97,
		employerFeeRate: 0.3142, // Arbetsgivaravgift
		socialSecurityRate: 0.0, // Included in employer fee usually for employee
		standardDeductionRate: 0, // Grundavdrag works differently, simplified here
		standardDeductionMax: 0,
		standardDeductionMin: 0,
		personalDeduction: 15400, // Grundavdrag varies, using low estimate
		generalTaxRate: 0.32, // Municipal tax approx
		brackets: [
			{ limit: 615300, rate: 0.2 } // State tax
		]
	},
	DK: {
		currency: 'DKK',
		currencyName: 'Danske kroner',
		exchangeRate: 0.63,
		employerFeeRate: 0, // Denmark has very low employer social costs, mostly in wage
		socialSecurityRate: 0.08, // AM-bidrag
		standardDeductionRate: 0,
		standardDeductionMax: 0,
		standardDeductionMin: 0,
		personalDeduction: 49700, // Personfradrag
		generalTaxRate: 0.37, // Bottom tax + Municipal (approx 12 + 25)
		brackets: [
			{ limit: 588900, rate: 0.15 } // Top tax (Topskat)
		]
	}
}

export const G_BASE = 124028 // Keeping G_BASE generic/global or NO specific
