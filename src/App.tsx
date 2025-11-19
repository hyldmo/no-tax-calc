import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, TrendingUp, Users, BarChart3, Info, Building, Wallet, PieChart, ArrowRight } from 'lucide-react';
import { ProcessedBucket, TaxDetails } from './types';
import {
  RAW_DATA,
  G_BASE,
  AGA_RATE,
  TRYGDEAVGIFT_RATE,
  MINSTEFRADRAG_RATE,
  MINSTEFRADRAG_MAX,
  MINSTEFRADRAG_MIN,
  PERSONFRADRAG,
  GENERAL_TAX_RATE
} from './data';
import { DistributionChart } from './components/DistributionChart';

const formatNOK = (amount: number) => {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const App: React.FC = () => {
  const [yearlyWage, setYearlyWage] = useState<string>('');
  const [pensionRate, setPensionRate] = useState<number>(2); // Default 2% OTP
  const [deductions, setDeductions] = useState<string>(''); // User deductions (IPS, interest, etc)
  const [monthlyWage, setMonthlyWage] = useState<number>(0);
  const [percentile, setPercentile] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'distribution' | 'tax'>('distribution');

  // Process data to get cumulative totals
  const processedData: ProcessedBucket[] = useMemo(() => {
    let cumulative = 0;
    const totalPopulation = RAW_DATA.reduce((acc, curr) => acc + curr.count, 0);

    return RAW_DATA.map(bucket => {
      const prevCumulative = cumulative;
      cumulative += bucket.count;
      return {
        ...bucket,
        cumulativeBelow: prevCumulative,
        cumulativeAbove: cumulative,
        percentileStart: (prevCumulative / totalPopulation) * 100,
        percentileEnd: (cumulative / totalPopulation) * 100,
      };
    });
  }, []);

  const totalPopulation = useMemo(() => RAW_DATA.reduce((acc, curr) => acc + curr.count, 0), []);

  // Tax Calculations
  const taxDetails: TaxDetails = useMemo(() => {
    const grossYearly = parseFloat(yearlyWage) || 0;
    const userDeductions = parseFloat(deductions) || 0;

    // 1. Pension (Employer OTP)
    // Mandatory OTP is usually calculated on income > 1G and < 12G
    // Note: This is EMPLOYER contribution, does not affect employee taxable income immediately
    const pensionBasis = Math.max(0, Math.min(grossYearly, 12 * G_BASE) - G_BASE);
    const pensionCost = pensionBasis * (pensionRate / 100);

    // 2. Arbeidsgiveravgift (Employer Tax)
    // Calculated on Gross Salary + Pension Contribution
    const agaBasis = grossYearly + pensionCost;
    const agaCost = agaBasis * AGA_RATE;

    // 3. Employee Tax (Estimated)

    // Minstefradrag (Standard deduction)
    // Has floor and ceiling
    let minstefradrag = grossYearly * MINSTEFRADRAG_RATE;
    if (minstefradrag > MINSTEFRADRAG_MAX) minstefradrag = MINSTEFRADRAG_MAX;
    if (minstefradrag < MINSTEFRADRAG_MIN && grossYearly > MINSTEFRADRAG_MIN) minstefradrag = MINSTEFRADRAG_MIN;
    if (grossYearly <= MINSTEFRADRAG_MIN) minstefradrag = grossYearly;


    // Alminnelig inntekt (General Income)
    // Gross - Standard Deductions - Personal Deductions (Interest, IPS, Unions etc)
    const generalIncomeBase = grossYearly - minstefradrag - PERSONFRADRAG;
    const generalIncome = Math.max(0, generalIncomeBase - userDeductions);

    const taxOnGeneralIncome = generalIncome * GENERAL_TAX_RATE;

    // Trygdeavgift (Social Security) - Based on Gross (Personinntekt)
    const trygdeavgift = grossYearly * TRYGDEAVGIFT_RATE;

    // Trinnskatt (Bracket Tax) - Based on Gross (Personinntekt)
    let trinnskatt = 0;

    // Chunk 1: 208k - 292k
    if (grossYearly > 208050) {
       const limit = 292850;
       const taxable = Math.min(grossYearly, limit) - 208050;
       if (taxable > 0) trinnskatt += taxable * 0.017;
    }
    if (grossYearly > 292850) {
        const limit = 670000;
        const taxable = Math.min(grossYearly, limit) - 292850;
        if (taxable > 0) trinnskatt += taxable * 0.040;
    }
    if (grossYearly > 670000) {
        const limit = 937900;
        const taxable = Math.min(grossYearly, limit) - 670000;
        if (taxable > 0) trinnskatt += taxable * 0.136;
    }
    if (grossYearly > 937900) {
        const limit = 1350000;
        const taxable = Math.min(grossYearly, limit) - 937900;
        if (taxable > 0) trinnskatt += taxable * 0.166;
    }
    if (grossYearly > 1350000) {
        const taxable = grossYearly - 1350000;
        trinnskatt += taxable * 0.176;
    }

    const totalEmployeeTax = taxOnGeneralIncome + trygdeavgift + trinnskatt;
    const netYearly = grossYearly - totalEmployeeTax;

    // Total Tax Wedge (What the state gets in total)
    const totalStateRevenue = totalEmployeeTax + agaCost;

    return {
      pensionCost,
      agaCost,
      totalEmployerCost: grossYearly + pensionCost + agaCost,
      totalEmployeeTax,
      netYearly,
      trygdeavgift,
      trinnskatt,
      taxOnGeneralIncome,
      totalStateRevenue,
      generalIncome
    };

  }, [yearlyWage, pensionRate, deductions]);

  useEffect(() => {
    if (!yearlyWage) {
      setPercentile(null);
      setMonthlyWage(0);
      return;
    }

    const yearly = parseFloat(yearlyWage);
    if (isNaN(yearly)) return;

    const monthly = yearly / 12;
    setMonthlyWage(monthly);

    // Calculate Percentile
    let calculatedPercentile = 0;
    const bucket = processedData.find(b => monthly >= b.min && monthly < b.max + 1);

    if (bucket) {
      const range = bucket.max - bucket.min;
      const positionInBucket = monthly - bucket.min;
      const fractionOfBucket = positionInBucket / range;

      const countBeforeBucket = bucket.cumulativeBelow;
      const countInBucketSoFar = bucket.count * fractionOfBucket;
      const totalCountBelow = countBeforeBucket + countInBucketSoFar;

      calculatedPercentile = (totalCountBelow / totalPopulation) * 100;
    } else {
      if (monthly < RAW_DATA[0].min) {
        calculatedPercentile = 0.1;
      } else {
        calculatedPercentile = 99.9;
      }
    }

    setPercentile(calculatedPercentile);
  }, [yearlyWage, processedData, totalPopulation]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <header className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center justify-center md:justify-start gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Lønnsfordeling i Norge
          </h1>
          <p className="text-slate-500 mt-2 max-w-xl">
            Se hvordan din årslønn sammenlignes med resten av Norges befolkning, og få en detaljert oversikt over skatt og arbeidsgiveravgift.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column: Inputs & Summary */}
          <div className="lg:col-span-5 space-y-6">

            {/* Main Input Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">

              {/* Salary Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Din Årslønn (Brutto)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">kr</span>
                  <input
                    type="number"
                    value={yearlyWage}
                    onChange={(e) => setYearlyWage(e.target.value)}
                    placeholder="550000"
                    className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none placeholder:text-slate-300"
                  />
                </div>
              </div>

              {/* Deductions Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Dine Fradrag (f.eks IPS, lån)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">kr</span>
                  <input
                    type="number"
                    value={deductions}
                    onChange={(e) => setDeductions(e.target.value)}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none placeholder:text-slate-300"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">F.eks: IPS (opptil 15k), renteutgifter, fagforening.</p>
              </div>

              {/* Pension Input */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-700">
                     Arbeidsgivers Pensjon (OTP)
                  </label>
                  <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {pensionRate}%
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="7"
                  step="0.5"
                  value={pensionRate}
                  onChange={(e) => setPensionRate(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>2% (Min)</span>
                  <span>7% (Maks)</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Dette er arbeidsgivers kostnad. Det øker "total skatt" (Skattekile) via arbeidsgiveravgift, men påvirker ikke din lønnsslipp direkte.
                </p>
              </div>

            </div>

            {/* Key Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                <span className="text-slate-500 text-sm font-medium flex items-center gap-2">
                  <Calculator className="w-4 h-4" /> Månedslønn
                </span>
                <div className="mt-2">
                  <span className="text-xl lg:text-2xl font-bold text-slate-800 block truncate">
                    {yearlyWage ? formatNOK(monthlyWage) : '—'}
                  </span>
                </div>
              </div>

              <div className={`p-5 rounded-2xl shadow-sm border flex flex-col justify-between transition-colors ${percentile !== null ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200'}`}>
                <span className={`text-sm font-medium flex items-center gap-2 ${percentile !== null ? 'text-blue-100' : 'text-slate-500'}`}>
                  <TrendingUp className="w-4 h-4" /> Persentil
                </span>
                <div className="mt-2">
                  <span className={`text-4xl font-bold block ${percentile !== null ? 'text-white' : 'text-slate-800'}`}>
                    {percentile !== null ? percentile.toFixed(1) + '%' : '—'}
                  </span>
                </div>
              </div>
            </div>

            {percentile !== null && (
              <div className="text-center text-sm text-slate-500">
                Du tjener mer enn <strong>{percentile.toFixed(1)}%</strong> av befolkningen.
              </div>
            )}
          </div>

          {/* Right Column: Tabs & Content */}
          <div className="lg:col-span-7 flex flex-col h-full">

            {/* Custom Tabs */}
            <div className="bg-white/50 p-1 rounded-xl border border-slate-200 mb-4 inline-flex self-start w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('distribution')}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'distribution'
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Fordeling
              </button>
              <button
                onClick={() => setActiveTab('tax')}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'tax'
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Wallet className="w-4 h-4" />
                Skatt & Kostnader
              </button>
            </div>

            {/* Tab Content Container */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex-1 relative overflow-hidden">

              {activeTab === 'distribution' ? (
                <div className="h-full flex flex-col">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Users className="w-5 h-5 text-slate-400" /> Befolkningsfordeling
                  </h3>

                  <div className="flex-1 w-full min-h-[300px]">
                     <DistributionChart data={processedData} userMonthly={monthlyWage} />
                  </div>

                  <div className="mt-4 flex justify-between text-xs text-slate-400 font-medium border-t border-slate-100 pt-4">
                    <span>5 000 kr</span>
                    <span>100 000 kr</span>
                    <span>200 000+ kr</span>
                  </div>
                </div>
              ) : (
                <div className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Building className="w-5 h-5 text-slate-400" /> Kostnadsanalyse
                    </h3>
                    <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">Estimat 2024</span>
                  </div>

                  {!yearlyWage ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                      <PieChart className="w-12 h-12 mb-3 opacity-50" />
                      <p>Skriv inn lønn for å se detaljer</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Employer Section */}
                      <div className="space-y-3">
                         <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Arbeidsgiver (Kostnad)</div>

                         <div className="flex justify-between items-center py-2 border-b border-slate-50">
                           <span className="text-slate-600">Bruttolønn</span>
                           <span className="font-medium text-slate-900">{formatNOK(parseFloat(yearlyWage))}</span>
                         </div>

                         <div className="flex justify-between items-center py-2 border-b border-slate-50">
                           <span className="text-slate-600 flex items-center gap-1">
                             Pensjon (OTP {pensionRate}%)
                             <Info className="w-3 h-3 text-slate-300" />
                           </span>
                           <span className="font-medium text-slate-900">+{formatNOK(taxDetails.pensionCost)}</span>
                         </div>

                         <div className="flex justify-between items-center py-2 border-b border-slate-50">
                           <span className="text-slate-600">Arbeidsgiveravgift (14.1%)</span>
                           <span className="font-medium text-slate-900">+{formatNOK(taxDetails.agaCost)}</span>
                         </div>

                         <div className="flex justify-between items-center pt-2">
                           <span className="font-bold text-slate-700">Total kostnad arbeidsgiver</span>
                           <span className="font-bold text-slate-900">{formatNOK(taxDetails.totalEmployerCost)}</span>
                         </div>
                      </div>

                      {/* Divider */}
                      <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                        <div className="relative bg-white px-3">
                           <ArrowRight className="w-4 h-4 text-slate-300 rotate-90" />
                        </div>
                      </div>

                      {/* Employee Section */}
                      <div className="space-y-3">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Arbeidstaker (Utbetalt)</div>

                        <div className="flex justify-between items-center py-2 border-b border-slate-50 bg-red-50/50 px-3 -mx-3 rounded-lg">
                           <div className="flex flex-col">
                             <span className="text-red-800 font-medium">Din Skatt (Estimert)</span>
                             <span className="text-xs text-red-600/70">Tabelltrekk / Prosent</span>
                           </div>
                           <span className="font-bold text-red-700">-{formatNOK(taxDetails.totalEmployeeTax)}</span>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                           <span className="font-bold text-emerald-700 text-lg">Netto utbetalt (år)</span>
                           <span className="font-bold text-emerald-700 text-lg">{formatNOK(taxDetails.netYearly)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-sm text-emerald-600/80">Netto utbetalt (mnd)</span>
                           <span className="text-sm font-semibold text-emerald-600/80">{formatNOK(taxDetails.netYearly / 12)}</span>
                        </div>
                      </div>

                      {/* Total Tax Wedge Section */}
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <div className="flex justify-between items-center mb-1">
                             <span className="font-bold text-slate-700">Totalt skatt (Skattekile)</span>
                             <span className="font-bold text-slate-900">{formatNOK(taxDetails.totalStateRevenue)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-500">
                             <span>Arbeidsgiveravgift + Din Skatt</span>
                             <span>{((taxDetails.totalStateRevenue / taxDetails.totalEmployerCost) * 100).toFixed(1)}% av totalkostnad</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
