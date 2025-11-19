import React from 'react'
import { Calculator, TrendingUp } from 'lucide-react'
import { formatNOK } from '../utils/format'

interface StatsGridProps {
	yearlyWage: string
	monthlyWage: number
	percentile: number | null
}

export const StatsGrid: React.FC<StatsGridProps> = ({ yearlyWage, monthlyWage, percentile }) => {
	return (
		<>
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
							{percentile !== null ? (100 - percentile).toFixed(1) + '%' : '—'}
						</span>
					</div>
				</div>
			</div>

			{percentile !== null && (
				<div className="text-center text-slate-500 text-sm">
					Du tjener mer enn <strong>{percentile.toFixed(1)}%</strong> av befolkningen.
				</div>
			)}
		</>
	)
}
