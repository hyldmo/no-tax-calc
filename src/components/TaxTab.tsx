import React from 'react'
import { Building, PieChart, Info, ArrowRight } from 'lucide-react'
import { TaxDetails } from '../types'
import { formatNOK } from '../utils/format'

interface TaxTabProps {
	yearlyWage: string
	pensionRate: number
	taxDetails: TaxDetails
}

export const TaxTab: React.FC<TaxTabProps> = ({ yearlyWage, pensionRate, taxDetails }) => {
	return (
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
							<span className="font-medium text-slate-900">{formatNOK(parseFloat(yearlyWage))}</span>
						</div>

						<div className="flex items-center justify-between border-slate-50 border-b py-2">
							<span className="flex items-center gap-1 text-slate-600">
								Pensjon (OTP {pensionRate}%)
								<Info className="h-3 w-3 text-slate-300" />
							</span>
							<span className="font-medium text-slate-900">+{formatNOK(taxDetails.pensionCost)}</span>
						</div>

						<div className="flex items-center justify-between border-slate-50 border-b py-2">
							<span className="text-slate-600">Arbeidsgiveravgift (14.1%)</span>
							<span className="font-medium text-slate-900">+{formatNOK(taxDetails.agaCost)}</span>
						</div>

						<div className="flex items-center justify-between pt-2">
							<span className="font-bold text-slate-700">Total kostnad arbeidsgiver</span>
							<span className="font-bold text-slate-900">{formatNOK(taxDetails.totalEmployerCost)}</span>
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
								<span className="font-medium text-red-800">Din Skatt (Estimert)</span>
								<span className="text-red-600/70 text-xs">Tabelltrekk / Prosent</span>
							</div>
							<span className="font-bold text-red-700">-{formatNOK(taxDetails.totalEmployeeTax)}</span>
						</div>

						<div className="flex items-center justify-between pt-2">
							<span className="font-bold text-emerald-700 text-lg">Netto utbetalt (år)</span>
							<span className="font-bold text-emerald-700 text-lg">
								{formatNOK(taxDetails.netYearly)}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-emerald-600/80 text-sm">Netto utbetalt (mnd)</span>
							<span className="font-semibold text-emerald-600/80 text-sm">
								{formatNOK(taxDetails.netYearly / 12)}
							</span>
						</div>
					</div>

					{/* Total Tax Wedge Section */}
					<div className="mt-4 border-slate-100 border-t pt-4">
						<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
							<div className="mb-1 flex items-center justify-between">
								<span className="font-bold text-slate-700">Totalt skatt (Skattekile)</span>
								<span className="font-bold text-slate-900">
									{formatNOK(taxDetails.totalStateRevenue)}
								</span>
							</div>
							<div className="flex justify-between text-slate-500 text-xs">
								<span>Arbeidsgiveravgift + Din Skatt</span>
								<span>
									{((taxDetails.totalStateRevenue / taxDetails.totalEmployerCost) * 100).toFixed(1)}%
									av totalkostnad
								</span>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
