import React, { useState, useMemo, useEffect } from 'react'
import { Calculator, TrendingUp, Users, BarChart3, Info, Building, Wallet, PieChart, ArrowRight } from 'lucide-react'
import { ProcessedBucket, TaxDetails } from './types'
import {
	RAW_DATA,
	G_BASE,
	AGA_RATE,
	TRYGDEAVGIFT_RATE,
	MINSTEFRADRAG_RATE,
	MINSTEFRADRAG_MAX,
	MINSTEFRADRAG_MIN,
	PERSONFRADRAG,
	GENERAL_TAX_RATE
} from './data'
import { DistributionChart } from './components/DistributionChart'

const formatNOK = (amount: number) => {
	return new Intl.NumberFormat('nb-NO', {
		style: 'currency',
		currency: 'NOK',
		maximumFractionDigits: 0
	}).format(amount)
}

export const App: React.FC = () => {
	const [yearlyWage, setYearlyWage] = useState<string>('')
	const [pensionRate, setPensionRate] = useState<number>(2) // Default 2% OTP
	const [deductions, setDeductions] = useState<string>('') // User deductions (IPS, interest, etc)
	const [monthlyWage, setMonthlyWage] = useState<number>(0)
	const [percentile, setPercentile] = useState<number | null>(null)
	const [activeTab, setActiveTab] = useState<'distribution' | 'tax'>('distribution')

	// Process data to get cumulative totals
	const processedData: ProcessedBucket[] = useMemo(() => {
		let cumulative = 0
		const totalPopulation = RAW_DATA.reduce((acc, curr) => acc + curr.count, 0)

		return RAW_DATA.map(bucket => {
			const prevCumulative = cumulative
			cumulative += bucket.count
			return {
				...bucket,
				cumulativeBelow: prevCumulative,
				cumulativeAbove: cumulative,
				percentileStart: (prevCumulative / totalPopulation) * 100,
				percentileEnd: (cumulative / totalPopulation) * 100
			}
		})
	}, [])

	const totalPopulation = useMemo(() => RAW_DATA.reduce((acc, curr) => acc + curr.count, 0), [])

	// Tax Calculations
	const taxDetails: TaxDetails = useMemo(() => {
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
	}, [yearlyWage, pensionRate, deductions])

	useEffect(() => {
		if (!yearlyWage) {
			setPercentile(null)
			setMonthlyWage(0)
			return
		}

		const yearly = parseFloat(yearlyWage)
		if (isNaN(yearly)) return

		const monthly = yearly / 12
		setMonthlyWage(monthly)

		// Calculate Percentile
		let calculatedPercentile = 0
		const bucket = processedData.find(b => monthly >= b.min && monthly < b.max + 1)

		if (bucket) {
			const range = bucket.max - bucket.min
			const positionInBucket = monthly - bucket.min
			const fractionOfBucket = positionInBucket / range

			const countBeforeBucket = bucket.cumulativeBelow
			const countInBucketSoFar = bucket.count * fractionOfBucket
			const totalCountBelow = countBeforeBucket + countInBucketSoFar

			calculatedPercentile = (totalCountBelow / totalPopulation) * 100
		} else {
			if (monthly < RAW_DATA[0].min) {
				calculatedPercentile = 0.1
			} else {
				calculatedPercentile = 99.9
			}
		}

		setPercentile(calculatedPercentile)
	}, [yearlyWage, processedData, totalPopulation])

	return (
		<div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-800 md:p-8">
			<div className="mx-auto max-w-4xl">
				{/* Header */}
				<header className="mb-8 text-center md:text-left">
					<h1 className="flex items-center justify-center gap-3 font-bold text-3xl text-slate-900 md:justify-start">
						<BarChart3 className="h-8 w-8 text-blue-600" />
						Lønnsfordeling i Norge
					</h1>
					<p className="mt-2 max-w-xl text-slate-500">
						Se hvordan din årslønn sammenlignes med resten av Norges befolkning, og få en detaljert oversikt
						over skatt og arbeidsgiveravgift.
					</p>
				</header>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
					{/* Left Column: Inputs & Summary */}
					<div className="space-y-6 lg:col-span-5">
						{/* Main Input Card */}
						<div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
							{/* Salary Input */}
							<div>
								<label className="mb-2 block font-semibold text-slate-700 text-sm">
									Din Årslønn (Brutto)
								</label>
								<div className="relative">
									<span className="-translate-y-1/2 absolute top-1/2 left-4 font-medium text-slate-400">
										kr
									</span>
									<input
										type="number"
										value={yearlyWage}
										onChange={e => setYearlyWage(e.target.value)}
										placeholder="550000"
										className="w-full rounded-xl border border-slate-200 bg-slate-50 py-4 pr-4 pl-10 font-bold text-slate-800 text-xl outline-none transition-all placeholder:text-slate-300 focus:border-transparent focus:ring-2 focus:ring-blue-500"
									/>
								</div>
							</div>

							{/* Deductions Input */}
							<div>
								<label className="mb-2 block font-semibold text-slate-700 text-sm">
									Dine Fradrag (f.eks IPS, lån)
								</label>
								<div className="relative">
									<span className="-translate-y-1/2 absolute top-1/2 left-4 font-medium text-slate-400">
										kr
									</span>
									<input
										type="number"
										value={deductions}
										onChange={e => setDeductions(e.target.value)}
										placeholder="0"
										className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-10 font-medium text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:border-transparent focus:ring-2 focus:ring-blue-500"
									/>
								</div>
								<p className="mt-1 text-slate-400 text-xs">
									F.eks: IPS (opptil 15k), renteutgifter, fagforening.
								</p>
							</div>

							{/* Pension Input */}
							<div>
								<div className="mb-2 flex justify-between">
									<label className="block font-semibold text-slate-700 text-sm">
										Arbeidsgivers Pensjon (OTP)
									</label>
									<span className="rounded bg-blue-50 px-2 py-0.5 font-bold text-blue-600 text-sm">
										{pensionRate}%
									</span>
								</div>
								<input
									type="range"
									min="2"
									max="7"
									step="0.5"
									value={pensionRate}
									onChange={e => setPensionRate(Number(e.target.value))}
									className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600"
								/>
								<div className="mt-1 flex justify-between text-slate-400 text-xs">
									<span>2% (Min)</span>
									<span>7% (Maks)</span>
								</div>
								<p className="mt-2 text-slate-400 text-xs">
									Dette er arbeidsgivers kostnad. Det øker "total skatt" (Skattekile) via
									arbeidsgiveravgift, men påvirker ikke din lønnsslipp direkte.
								</p>
							</div>
						</div>

						{/* Key Stats Grid */}
						<div className="grid grid-cols-2 gap-4">
							<div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
								<span className="flex items-center gap-2 font-medium text-slate-500 text-sm">
									<Calculator className="h-4 w-4" /> Månedslønn
								</span>
								<div className="mt-2">
									<span className="block truncate font-bold text-slate-800 text-xl lg:text-2xl">
										{yearlyWage ? formatNOK(monthlyWage) : '—'}
									</span>
								</div>
							</div>

							<div
								className={`flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition-colors ${percentile !== null ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white'}`}
							>
								<span
									className={`flex items-center gap-2 font-medium text-sm ${percentile !== null ? 'text-blue-100' : 'text-slate-500'}`}
								>
									<TrendingUp className="h-4 w-4" /> Persentil
								</span>
								<div className="mt-2">
									<span
										className={`block font-bold text-4xl ${percentile !== null ? 'text-white' : 'text-slate-800'}`}
									>
										{percentile !== null ? percentile.toFixed(1) + '%' : '—'}
									</span>
								</div>
							</div>
						</div>

						{percentile !== null && (
							<div className="text-center text-slate-500 text-sm">
								Du tjener mer enn <strong>{percentile.toFixed(1)}%</strong> av befolkningen.
							</div>
						)}
					</div>

					{/* Right Column: Tabs & Content */}
					<div className="flex h-full flex-col lg:col-span-7">
						{/* Custom Tabs */}
						<div className="mb-4 inline-flex w-full self-start rounded-xl border border-slate-200 bg-white/50 p-1 sm:w-auto">
							<button
								onClick={() => setActiveTab('distribution')}
								className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-2 font-semibold text-sm transition-all sm:flex-none ${
									activeTab === 'distribution'
										? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
										: 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
								}`}
							>
								<BarChart3 className="h-4 w-4" />
								Fordeling
							</button>
							<button
								onClick={() => setActiveTab('tax')}
								className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-2 font-semibold text-sm transition-all sm:flex-none ${
									activeTab === 'tax'
										? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
										: 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
								}`}
							>
								<Wallet className="h-4 w-4" />
								Skatt & Kostnader
							</button>
						</div>

						{/* Tab Content Container */}
						<div className="relative flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
							{activeTab === 'distribution' ? (
								<div className="flex h-full flex-col">
									<h3 className="mb-6 flex items-center gap-2 font-bold text-lg text-slate-800">
										<Users className="h-5 w-5 text-slate-400" /> Befolkningsfordeling
									</h3>

									<div className="min-h-[300px] w-full flex-1">
										<DistributionChart data={processedData} userMonthly={monthlyWage} />
									</div>

									<div className="mt-4 flex justify-between border-slate-100 border-t pt-4 font-medium text-slate-400 text-xs">
										<span>5 000 kr</span>
										<span>100 000 kr</span>
										<span>200 000+ kr</span>
									</div>
								</div>
							) : (
								<div className="fade-in slide-in-from-bottom-2 h-full animate-in duration-300">
									<div className="mb-6 flex items-center justify-between">
										<h3 className="flex items-center gap-2 font-bold text-lg text-slate-800">
											<Building className="h-5 w-5 text-slate-400" /> Kostnadsanalyse
										</h3>
										<span className="rounded border border-slate-100 bg-slate-50 px-2 py-1 font-medium text-slate-400 text-xs">
											Estimat 2024
										</span>
									</div>

									{!yearlyWage ? (
										<div className="flex h-64 flex-col items-center justify-center text-slate-400">
											<PieChart className="mb-3 h-12 w-12 opacity-50" />
											<p>Skriv inn lønn for å se detaljer</p>
										</div>
									) : (
										<div className="space-y-6">
											{/* Employer Section */}
											<div className="space-y-3">
												<div className="font-bold text-slate-400 text-xs uppercase tracking-wider">
													Arbeidsgiver (Kostnad)
												</div>

												<div className="flex items-center justify-between border-slate-50 border-b py-2">
													<span className="text-slate-600">Bruttolønn</span>
													<span className="font-medium text-slate-900">
														{formatNOK(parseFloat(yearlyWage))}
													</span>
												</div>

												<div className="flex items-center justify-between border-slate-50 border-b py-2">
													<span className="flex items-center gap-1 text-slate-600">
														Pensjon (OTP {pensionRate}%)
														<Info className="h-3 w-3 text-slate-300" />
													</span>
													<span className="font-medium text-slate-900">
														+{formatNOK(taxDetails.pensionCost)}
													</span>
												</div>

												<div className="flex items-center justify-between border-slate-50 border-b py-2">
													<span className="text-slate-600">Arbeidsgiveravgift (14.1%)</span>
													<span className="font-medium text-slate-900">
														+{formatNOK(taxDetails.agaCost)}
													</span>
												</div>

												<div className="flex items-center justify-between pt-2">
													<span className="font-bold text-slate-700">
														Total kostnad arbeidsgiver
													</span>
													<span className="font-bold text-slate-900">
														{formatNOK(taxDetails.totalEmployerCost)}
													</span>
												</div>
											</div>

											{/* Divider */}
											<div className="relative flex items-center justify-center">
												<div className="absolute inset-0 flex items-center">
													<div className="w-full border-slate-200 border-t"></div>
												</div>
												<div className="relative bg-white px-3">
													<ArrowRight className="h-4 w-4 rotate-90 text-slate-300" />
												</div>
											</div>

											{/* Employee Section */}
											<div className="space-y-3">
												<div className="font-bold text-slate-400 text-xs uppercase tracking-wider">
													Arbeidstaker (Utbetalt)
												</div>

												<div className="-mx-3 flex items-center justify-between rounded-lg border-slate-50 border-b bg-red-50/50 px-3 py-2">
													<div className="flex flex-col">
														<span className="font-medium text-red-800">
															Din Skatt (Estimert)
														</span>
														<span className="text-red-600/70 text-xs">
															Tabelltrekk / Prosent
														</span>
													</div>
													<span className="font-bold text-red-700">
														-{formatNOK(taxDetails.totalEmployeeTax)}
													</span>
												</div>

												<div className="flex items-center justify-between pt-2">
													<span className="font-bold text-emerald-700 text-lg">
														Netto utbetalt (år)
													</span>
													<span className="font-bold text-emerald-700 text-lg">
														{formatNOK(taxDetails.netYearly)}
													</span>
												</div>
												<div className="flex items-center justify-between">
													<span className="text-emerald-600/80 text-sm">
														Netto utbetalt (mnd)
													</span>
													<span className="font-semibold text-emerald-600/80 text-sm">
														{formatNOK(taxDetails.netYearly / 12)}
													</span>
												</div>
											</div>

											{/* Total Tax Wedge Section */}
											<div className="mt-4 border-slate-100 border-t pt-4">
												<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
													<div className="mb-1 flex items-center justify-between">
														<span className="font-bold text-slate-700">
															Totalt skatt (Skattekile)
														</span>
														<span className="font-bold text-slate-900">
															{formatNOK(taxDetails.totalStateRevenue)}
														</span>
													</div>
													<div className="flex justify-between text-slate-500 text-xs">
														<span>Arbeidsgiveravgift + Din Skatt</span>
														<span>
															{(
																(taxDetails.totalStateRevenue /
																	taxDetails.totalEmployerCost) *
																100
															).toFixed(1)}
															% av totalkostnad
														</span>
													</div>
												</div>
											</div>
										</div>
									)}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
