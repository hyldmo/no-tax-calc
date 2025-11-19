import React from 'react'
import { Users } from 'lucide-react'
import { ProcessedBucket } from '../types'
import { DistributionChart } from './DistributionChart'

interface DistributionTabProps {
	data: ProcessedBucket[]
	userMonthly: number
}

export const DistributionTab: React.FC<DistributionTabProps> = ({ data, userMonthly }) => {
	return (
		<div className="flex h-full flex-col">
			<h3 className="mb-6 flex items-center gap-2 font-bold text-lg text-slate-800">
				<Users className="h-5 w-5 text-slate-400" /> Befolkningsfordeling
			</h3>

			<div className="min-h-[300px] w-full flex-1">
				<DistributionChart data={data} userMonthly={userMonthly} />
			</div>

			<div className="mt-4 flex justify-between border-slate-100 border-t pt-4 font-medium text-slate-400 text-xs">
				<span>5 000 kr</span>
				<span>100 000 kr</span>
				<span>200 000+ kr</span>
			</div>
		</div>
	)
}
