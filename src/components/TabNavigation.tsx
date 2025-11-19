import React from 'react'
import { BarChart3, Wallet } from 'lucide-react'

interface TabNavigationProps {
	activeTab: 'distribution' | 'tax'
	setActiveTab: (tab: 'distribution' | 'tax') => void
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, setActiveTab }) => {
	return (
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
	)
}
