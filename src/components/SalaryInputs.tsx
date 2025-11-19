import React from 'react'

interface SalaryInputsProps {
	yearlyWage: string
	setYearlyWage: (value: string) => void
	deductions: string
	setDeductions: (value: string) => void
	pensionRate: number
	setPensionRate: (value: number) => void
}

export const SalaryInputs: React.FC<SalaryInputsProps> = ({
	yearlyWage,
	setYearlyWage,
	deductions,
	setDeductions,
	pensionRate,
	setPensionRate
}) => {
	return (
		<div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			{/* Salary Input */}
			<div>
				<label className="mb-2 block font-semibold text-slate-700 text-sm">Din Årslønn (Brutto)</label>
				<div className="relative">
					<span className="-translate-y-1/2 absolute top-1/2 left-4 font-medium text-slate-400">kr</span>
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
				<label className="mb-2 block font-semibold text-slate-700 text-sm">Dine Fradrag (f.eks IPS, lån)</label>
				<div className="relative">
					<span className="-translate-y-1/2 absolute top-1/2 left-4 font-medium text-slate-400">kr</span>
					<input
						type="number"
						value={deductions}
						onChange={e => setDeductions(e.target.value)}
						placeholder="0"
						className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-10 font-medium text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:border-transparent focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<p className="mt-1 text-slate-400 text-xs">F.eks: IPS (opptil 15k), renteutgifter, fagforening.</p>
			</div>

			{/* Pension Input */}
			<div>
				<div className="mb-2 flex justify-between">
					<label className="block font-semibold text-slate-700 text-sm">Arbeidsgivers Pensjon (OTP)</label>
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
					Dette er arbeidsgivers kostnad. Det øker "total skatt" (Skattekile) via arbeidsgiveravgift, men
					påvirker ikke din lønnsslipp direkte.
				</p>
			</div>
		</div>
	)
}
