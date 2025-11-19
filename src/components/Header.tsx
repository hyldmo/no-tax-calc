import React from 'react'
import { BarChart3 } from 'lucide-react'

export const Header: React.FC = () => {
	return (
		<header className="mb-8 text-center md:text-left">
			<h1 className="flex items-center justify-center gap-3 font-bold text-3xl text-slate-900 md:justify-start">
				<BarChart3 className="h-8 w-8 text-blue-600" />
				Lønnsfordeling i Norge
			</h1>
			<p className="mt-2 max-w-xl text-slate-500">
				Se hvordan din årslønn sammenlignes med resten av Norges befolkning, og få en detaljert oversikt over
				skatt og arbeidsgiveravgift.
			</p>
		</header>
	)
}
