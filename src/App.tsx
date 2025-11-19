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
import { useStorageState } from './hooks/useStorageState'
import { TAX_CONFIGS } from './taxConfig'

export const App: React.FC = () => {
	const [yearlyWage, setYearlyWage] = useStorageState<string>('yearlyWage', '')
	const [pensionRate, setPensionRate] = useStorageState<number>('pensionRate', 2)
	const [deductions, setDeductions] = useStorageState<string>('deductions', '')
	const [country, setCountry] = useStorageState<Country>('country', 'NO')

	const [monthlyWage, setMonthlyWage] = useState<number>(0)
	const [effectiveMonthlyWage, setEffectiveMonthlyWage] = useState<number>(0)
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
	const taxDetails = useMemo(
		() => calculateTaxDetails(yearlyWage, pensionRate, deductions, country),
		[yearlyWage, pensionRate, deductions, country]
	)

	useEffect(() => {
		if (!yearlyWage) {
			setPercentile(null)
			setMonthlyWage(0)
			setEffectiveMonthlyWage(0)
			return
		}

		const yearly = parseFloat(yearlyWage)
		if (isNaN(yearly)) return

		const monthly = yearly / 12
		setMonthlyWage(monthly)

		// Calculate Effective Monthly Wage for comparison
		// Adjust user salary to be comparable to base salary distribution
		// by normalizing pension rates.
		let effectiveMonthly = monthly

		const config = TAX_CONFIGS[country]
		if (config.calculateEffectiveMonthly) {
			effectiveMonthly = config.calculateEffectiveMonthly(monthly, pensionRate)
		}

		setEffectiveMonthlyWage(effectiveMonthly)

		// Calculate Percentile
		let calculatedPercentile = 0
		const bucket = processedData.find(b => effectiveMonthly >= b.min && effectiveMonthly < b.max + 1)

		if (bucket) {
			const range = bucket.max - bucket.min
			const positionInBucket = effectiveMonthly - bucket.min
			const fractionOfBucket = positionInBucket / range

			const countBeforeBucket = bucket.cumulativeBelow
			const countInBucketSoFar = bucket.count * fractionOfBucket
			const totalCountBelow = countBeforeBucket + countInBucketSoFar

			calculatedPercentile = (totalCountBelow / totalPopulation) * 100
		} else {
			if (effectiveMonthly < RAW_DATA[0].min) {
				calculatedPercentile = 0.1
			} else {
				calculatedPercentile = 99.9
			}
		}

		setPercentile(calculatedPercentile)
	}, [yearlyWage, processedData, totalPopulation, pensionRate, country])

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
							country={country}
						/>

						<StatsGrid yearlyWage={yearlyWage} monthlyWage={monthlyWage} percentile={percentile} />
					</div>

					{/* Right Column: Tabs & Content */}
					<div className="flex h-full flex-col lg:col-span-7">
						<TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

						{/* Tab Content Container */}
						<div className="relative flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
							{activeTab === 'distribution' ? (
								<DistributionTab data={processedData} userMonthly={effectiveMonthlyWage} />
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
