import React, { useState, useMemo, useEffect } from 'react'
import { ProcessedBucket, Country } from './types'
import { RAW_DATA } from './data'
import { Header } from './components/Header'
import { SalaryInputs } from './components/SalaryInputs'
import { StatsGrid } from './components/StatsGrid'
import { TabNavigation } from './components/TabNavigation'
import { DistributionTab } from './components/DistributionTab'
import { TaxTab } from './components/TaxTab'
import { calculateTaxDetails } from './utils/taxCalculations'

const STORAGE_KEYS = {
	yearlyWage: 'no-tax-calc-yearly-wage',
	deductions: 'no-tax-calc-deductions',
	pensionRate: 'no-tax-calc-pension-rate',
	country: 'no-tax-calc-country'
}

export const App: React.FC = () => {
	const [yearlyWage, setYearlyWage] = useState<string>(() => {
		return localStorage.getItem(STORAGE_KEYS.yearlyWage) || ''
	})
	const [pensionRate, setPensionRate] = useState<number>(() => {
		const stored = localStorage.getItem(STORAGE_KEYS.pensionRate)
		return stored ? Number(stored) : 2
	})
	const [deductions, setDeductions] = useState<string>(() => {
		return localStorage.getItem(STORAGE_KEYS.deductions) || ''
	})
	const [country, setCountry] = useState<Country>(() => {
		return (localStorage.getItem(STORAGE_KEYS.country) as Country) || 'NO'
	})

	const [monthlyWage, setMonthlyWage] = useState<number>(0)
	const [percentile, setPercentile] = useState<number | null>(null)
	const [activeTab, setActiveTab] = useState<'distribution' | 'tax'>('distribution')

	// Persist to localStorage
	useEffect(() => {
		if (yearlyWage) {
			localStorage.setItem(STORAGE_KEYS.yearlyWage, yearlyWage)
		} else {
			localStorage.removeItem(STORAGE_KEYS.yearlyWage)
		}
	}, [yearlyWage])

	useEffect(() => {
		if (deductions) {
			localStorage.setItem(STORAGE_KEYS.deductions, deductions)
		} else {
			localStorage.removeItem(STORAGE_KEYS.deductions)
		}
	}, [deductions])

	useEffect(() => {
		localStorage.setItem(STORAGE_KEYS.pensionRate, String(pensionRate))
	}, [pensionRate])

	useEffect(() => {
		localStorage.setItem(STORAGE_KEYS.country, country)
	}, [country])

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
	const taxDetails = useMemo(
		() => calculateTaxDetails(yearlyWage, pensionRate, deductions, country),
		[yearlyWage, pensionRate, deductions, country]
	)

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
				<Header country={country} setCountry={setCountry} />

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
					{/* Left Column: Inputs & Summary */}
					<div className="space-y-6 lg:col-span-5">
						<SalaryInputs
							yearlyWage={yearlyWage}
							setYearlyWage={setYearlyWage}
							deductions={deductions}
							setDeductions={setDeductions}
							pensionRate={pensionRate}
							setPensionRate={setPensionRate}
						/>

						<StatsGrid yearlyWage={yearlyWage} monthlyWage={monthlyWage} percentile={percentile} />
					</div>

					{/* Right Column: Tabs & Content */}
					<div className="flex h-full flex-col lg:col-span-7">
						<TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

						{/* Tab Content Container */}
						<div className="relative flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
							{activeTab === 'distribution' ? (
								<DistributionTab data={processedData} userMonthly={monthlyWage} />
							) : (
								<TaxTab
									yearlyWage={yearlyWage}
									pensionRate={pensionRate}
									taxDetails={taxDetails}
									country={country}
								/>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
