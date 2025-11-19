import React from 'react'
import { BarChart3, Globe } from 'lucide-react'
import { Country } from '../types'

interface HeaderProps {
	country: Country
	setCountry: (c: Country) => void
}

export const Header: React.FC<HeaderProps> = ({ country, setCountry }) => {
	return (
		<header className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
			<div className="text-center md:text-left">
				<h1 className="flex items-center justify-center gap-3 font-bold text-3xl text-slate-900 md:justify-start">
					<BarChart3 className="h-8 w-8 text-blue-600" />
					Lønnsfordeling
				</h1>
				<p className="mt-2 max-w-xl text-slate-500">
					Se hvordan din årslønn sammenlignes med resten av befolkningen, og få en detaljert oversikt over
					skatt og arbeidsgiveravgift for valgt land.
				</p>
			</div>

			<div className="flex justify-center md:justify-end">
				<div className="relative">
					<select
						value={country}
						onChange={e => setCountry(e.target.value as Country)}
						className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-10 pl-10 font-medium text-slate-700 shadow-sm transition-colors hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					>
						<option value="NO">🇳🇴 Norge</option>
						<option value="SE">🇸🇪 Sverige</option>
						<option value="DK">🇩🇰 Danmark</option>
					</select>
					<Globe className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-slate-400" />
					<div className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-3 text-slate-400">
						<svg
							className="h-4 w-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
						</svg>
					</div>
				</div>
			</div>
		</header>
	)
}
