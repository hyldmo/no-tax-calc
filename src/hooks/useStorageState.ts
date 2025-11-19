import { useState, useEffect } from 'react'

const STORAGE_KEYS = {
	yearlyWage: 'no-tax-calc-yearly-wage',
	deductions: 'no-tax-calc-deductions',
	pensionRate: 'no-tax-calc-pension-rate',
	country: 'no-tax-calc-country'
}

export function useStorageState<T>(key: keyof typeof STORAGE_KEYS, defaultValue: T): [T, (value: T) => void] {
	const storageKey = STORAGE_KEYS[key]

	const [state, setState] = useState<T>(() => {
		const stored = localStorage.getItem(storageKey)
		if (stored === null) {
			return defaultValue
		}
		if (typeof defaultValue === 'string') {
			return (stored as unknown as T) || defaultValue
		}
		if (typeof defaultValue === 'number') {
			const parsed = Number(stored)
			return isNaN(parsed) ? defaultValue : (parsed as unknown as T)
		}
		try {
			return JSON.parse(stored) as T
		} catch {
			return defaultValue
		}
	})

	useEffect(() => {
		if (state === null || state === undefined || state === '') {
			localStorage.removeItem(storageKey)
		} else {
			const valueToStore =
				typeof state === 'string' || typeof state === 'number' ? String(state) : JSON.stringify(state)
			localStorage.setItem(storageKey, valueToStore)
		}
	}, [state, storageKey])

	return [state, setState]
}
