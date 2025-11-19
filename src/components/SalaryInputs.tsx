import React from 'react'
import { NumericFormat } from 'react-number-format'
import { PensionSlider } from './PensionSlider'
import { getPensionStats, Country } from '../taxConfig'

interface SalaryInputsProps {
	yearlyWage: string
	setYearlyWage: (value: string) => void
	deductions: string
	setDeductions: (value: string) => void
	pensionRate: number
	setPensionRate: (value: number) => void
	country: Country
}

export const SalaryInputs: React.FC<SalaryInputsProps> = ({
	yearlyWage,
	setYearlyWage,
	deductions,
	setDeductions,
	pensionRate,
	setPensionRate,
	country
}) => {
	const { avg } = getPensionStats(country)

	return (
		<div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			{/* Salary Input */}
			<div>
				<label className="mb-2 block font-semibold text-slate-700 text-sm">Din Årslønn (Brutto)</label>
				<div className="relative">
					<span className="-translate-y-1/2 absolute top-1/2 left-4 font-medium text-slate-400">kr</span>
					<NumericFormat
						value={yearlyWage}
						onValueChange={values => setYearlyWage(values.value)}
						thousandSeparator=" "
						placeholder="550000"
						allowNegative={false}
						className="w-full rounded-xl border border-slate-200 bg-slate-50 py-4 pr-4 pl-10 font-bold text-slate-800 text-xl outline-none transition-all placeholder:text-slate-300 focus:border-transparent focus:ring-2 focus:ring-blue-500"
					/>
				</div>
			</div>

			{/* Deductions Input */}
			<div>
				<label className="mb-2 block font-semibold text-slate-700 text-sm">Dine Fradrag (f.eks IPS, lån)</label>
				<div className="relative">
					<span className="-translate-y-1/2 absolute top-1/2 left-4 font-medium text-slate-400">kr</span>
					<NumericFormat
						value={deductions}
						onValueChange={values => setDeductions(values.value)}
						thousandSeparator=" "
						placeholder="0"
						allowNegative={false}
						className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-10 font-medium text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:border-transparent focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<p className="mt-1 text-slate-400 text-xs">F.eks: IPS (opptil 15k), renteutgifter, fagforening.</p>
			</div>

			{/* Pension Input */}
			<div>
				<div className="mb-2 flex justify-between">
					<label className="block font-semibold text-slate-700 text-sm">Arbeidsgivers Pensjon (OTP)</label>
				</div>

				<PensionSlider value={pensionRate} onChange={setPensionRate} country={country} />

				<p className="mt-2 text-slate-400 text-xs">
					OTP-satser varierer. Gjennomsnittet i privat sektor er ca {avg}%. Din sats påvirker sammenligningen
					av "total lønn".
				</p>
			</div>
		</div>
	)
}
