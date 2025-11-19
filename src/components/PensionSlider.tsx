import React, { useRef, useEffect, useState } from 'react'
import { getPensionStats, Country } from '../taxConfig'

interface PensionSliderProps {
	value: number
	onChange: (value: number) => void
	country: Country
}

export const PensionSlider: React.FC<PensionSliderProps> = ({ value, onChange, country }) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const [isDragging, setIsDragging] = useState(false)
	const { min, max, distribution } = getPensionStats(country)

	// Define segment colors in order
	const SEGMENT_COLORS = ['bg-slate-300/50', 'bg-blue-200/50', 'bg-blue-400/50']

	const handleInteraction = (clientX: number) => {
		if (!containerRef.current) return
		const rect = containerRef.current.getBoundingClientRect()
		const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
		const percentage = x / rect.width
		const newValue = min + percentage * (max - min)

		// Round to nearest 0.1
		const roundedValue = Math.round(newValue * 10) / 10
		onChange(Math.max(min, Math.min(max, roundedValue)))
	}

	const handleMouseDown = (e: React.MouseEvent) => {
		setIsDragging(true)
		handleInteraction(e.clientX)
	}

	const handleTouchStart = (e: React.TouchEvent) => {
		setIsDragging(true)
		handleInteraction(e.touches[0].clientX)
	}

	useEffect(() => {
		const handleMove = (e: MouseEvent) => {
			if (isDragging) {
				handleInteraction(e.clientX)
			}
		}

		const handleUp = () => {
			setIsDragging(false)
		}

		const handleTouchMove = (e: TouchEvent) => {
			if (isDragging) {
				handleInteraction(e.touches[0].clientX)
			}
		}

		if (isDragging) {
			window.addEventListener('mousemove', handleMove)
			window.addEventListener('mouseup', handleUp)
			window.addEventListener('touchmove', handleTouchMove)
			window.addEventListener('touchend', handleUp)
		}

		return () => {
			window.removeEventListener('mousemove', handleMove)
			window.removeEventListener('mouseup', handleUp)
			window.removeEventListener('touchmove', handleTouchMove)
			window.removeEventListener('touchend', handleUp)
		}
	}, [isDragging])

	const currentPercentage = ((value - min) / (max - min)) * 100

	return (
		<div className="group select-none px-4 pb-10">
			<div
				ref={containerRef}
				className="relative h-4 w-full cursor-pointer"
				onMouseDown={handleMouseDown}
				onTouchStart={handleTouchStart}
			>
				{/* Track Background */}
				<div className="-translate-y-1/2 absolute top-1/2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
					{/* Colored Segments - Dynamically calculated */}
					<div className="absolute inset-0 flex">
						{distribution.map((item, index) => {
							// Calculate start and end points for this segment
							const prevRate = index > 0 ? distribution[index - 1].rate : min
							const nextRate = index < distribution.length - 1 ? distribution[index + 1].rate : max

							// Start is midpoint between prev and current (or min for first)
							const start = index === 0 ? min : (prevRate + item.rate) / 2

							// End is midpoint between current and next (or max for last)
							const end = index === distribution.length - 1 ? max : (item.rate + nextRate) / 2

							const widthPercentage = ((end - start) / (max - min)) * 100

							return (
								<div
									key={item.rate}
									className={`h-full ${SEGMENT_COLORS[index % SEGMENT_COLORS.length]}`}
									style={{
										width: `${widthPercentage}%`
									}}
								/>
							)
						})}
					</div>
				</div>

				{/* Fill Line (Active) */}
				<div
					className="-translate-y-1/2 absolute top-1/2 h-2 rounded-l-full bg-blue-600 transition-all duration-75"
					style={{ width: `${currentPercentage}%` }}
				/>

				{/* Thumb */}
				<div
					className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 z-20 h-6 w-6 rounded-full border-2 border-white bg-blue-600 shadow-md transition-transform duration-75 hover:scale-110 active:scale-95"
					style={{ left: `${currentPercentage}%` }}
				/>

				{/* Labels */}
				<div className="absolute top-4 left-0 w-full text-xs">
					{distribution.map(item => {
						const pos = ((item.rate - min) / (max - min)) * 100
						return (
							<div
								key={item.rate}
								className="-translate-x-1/2 absolute flex flex-col items-center"
								style={{
									left: `${pos}%`
								}}
							>
								<div className="h-1.5 w-0.5 bg-slate-300" />
								<span className="mt-0.5 font-medium text-slate-400">{item.rate}%</span>
								<span className="text-[10px] text-slate-400">({item.percentage}%)</span>
							</div>
						)
					})}
				</div>

				{/* Floating Current Value */}
				<div
					className={`-top-8 -translate-x-1/2 after:-translate-x-1/2 absolute rounded-md bg-slate-800 px-2 py-1 font-bold text-white text-xs transition-opacity duration-200 after:absolute after:bottom-[-4px] after:left-1/2 after:h-2 after:w-2 after:rotate-45 after:bg-slate-800 ${
						isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
					}`}
					style={{ left: `${currentPercentage}%` }}
				>
					{value.toFixed(1)}%
				</div>
			</div>
		</div>
	)
}
