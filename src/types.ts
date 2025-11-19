export interface WageBucket {
	min: number
	max: number
	count: number
}

export interface ProcessedBucket extends WageBucket {
	cumulativeBelow: number
	cumulativeAbove: number
	percentileStart: number
	percentileEnd: number
}

export interface TaxDetails {
	pensionCost: number
	agaCost: number
	totalEmployerCost: number
	totalEmployeeTax: number
	netYearly: number
	trygdeavgift: number
	trinnskatt: number
	taxOnGeneralIncome: number
	totalStateRevenue: number
	generalIncome: number
}

export interface TaxBrackets {
	limit: number
	rate: number
}

export type Country = 'NO' | 'SE' | 'DK'
