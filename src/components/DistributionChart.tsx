import React from 'react'
import { ProcessedBucket } from '../types'

interface DistributionChartProps {
	data: ProcessedBucket[]
	userMonthly: number
}

export const DistributionChart: React.FC<DistributionChartProps> = ({ data, userMonthly }) => {
	// Chart Configuration
	// const width = 100; // Percent - Unused but kept for context
	// const height = 100; // Percent - Unused but kept for context
	const maxCount = Math.max(...data.map(d => d.count))
	const barWidth = 100 / data.length

	// Find active bucket index for highlighting
	const activeBucketIndex = data.findIndex(b => userMonthly >= b.min && userMonthly < b.max)

	// Calculate user line position based on bucket system
	let userLineX = 0
	if (userMonthly > 0 && activeBucketIndex >= 0) {
		const bucket = data[activeBucketIndex]
		const bucketRange = bucket.max - bucket.min
		const positionInBucket = userMonthly - bucket.min
		const fractionInBucket = bucketRange > 0 ? positionInBucket / bucketRange : 0.5
		userLineX = (activeBucketIndex + fractionInBucket) * barWidth
	} else if (userMonthly > 0) {
		// If outside range, position at end
		userLineX = data.length * barWidth
	}

	return (
		<div className="relative h-full min-h-[250px] w-full pb-8">
			<svg width="100%" height="100%" preserveAspectRatio="none" className="overflow-visible">
				<defs>
					<linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#94a3b8" stopOpacity="0.4" />
						<stop offset="100%" stopColor="#94a3b8" stopOpacity="0.1" />
					</linearGradient>
					<linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#2563eb" stopOpacity="0.9" />
						<stop offset="100%" stopColor="#2563eb" stopOpacity="0.4" />
					</linearGradient>
				</defs>

				{/* Bars */}
				{data.map((bucket, index) => {
					const barHeight = (bucket.count / maxCount) * 100
					const isActive = index === activeBucketIndex
					const x = index * barWidth
					const y = 100 - barHeight

					return (
						<g key={bucket.min} className="group">
							{/* The visible bar */}
							<rect
								x={`${x}%`}
								y={`${y}%`}
								width={`${barWidth - 0.2}%`}
								height={`${barHeight}%`}
								fill={isActive ? 'url(#activeGradient)' : 'url(#barGradient)'}
								className="transition-all duration-500 ease-out"
								rx="2"
							/>

							{/* Invisible hover hit area */}
							<rect x={`${x}%`} y="0" width={`${barWidth}%`} height="100%" fill="transparent">
								<title>{`${bucket.min}-${
									bucket.max
								} kr: ${bucket.count.toLocaleString()} personer`}</title>
							</rect>
						</g>
					)
				})}

				{/* User Line Marker */}
				{userMonthly > 0 && (
					<g
						className="transition-all duration-700 ease-out"
						style={{ transform: `translateX(${userLineX}%)` }}
					>
						<line x1="0" y1="0%" x2="0" y2="100%" stroke="#2563eb" strokeWidth="2" strokeDasharray="4 2" />
						<g transform="translate(0, 100%)">
							<circle cx="0" cy="0" r="4" fill="#2563eb" />
							<foreignObject x="-45" y="8" width="90" height="20" style={{ overflow: 'visible' }}>
								<div className="rounded bg-slate-800 px-3 py-1 text-center font-bold text-white text-xs">
									Du er her
								</div>
							</foreignObject>
						</g>
					</g>
				)}
			</svg>
		</div>
	)
}
