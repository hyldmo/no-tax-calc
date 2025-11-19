import { WageBucket } from './types';

// Intervals are monthly wages. Count is number of wage earners.
export const RAW_DATA: WageBucket[] = [
  { min: 5000, max: 9999, count: 198 },
  { min: 10000, max: 14999, count: 3078 },
  { min: 15000, max: 19999, count: 9008 },
  { min: 20000, max: 24999, count: 28504 },
  { min: 25000, max: 29999, count: 56754 },
  { min: 30000, max: 34999, count: 157337 },
  { min: 35000, max: 39999, count: 252486 },
  { min: 40000, max: 44999, count: 365136 },
  { min: 45000, max: 49999, count: 396705 },
  { min: 50000, max: 54999, count: 374497 },
  { min: 55000, max: 59999, count: 327270 },
  { min: 60000, max: 64999, count: 266394 },
  { min: 65000, max: 69999, count: 190233 },
  { min: 70000, max: 74999, count: 139360 },
  { min: 75000, max: 79999, count: 100831 },
  { min: 80000, max: 84999, count: 77777 },
  { min: 85000, max: 89999, count: 59411 },
  { min: 90000, max: 94999, count: 48290 },
  { min: 95000, max: 100000, count: 34507 },
  { min: 100000, max: 104999, count: 31604 },
  { min: 105000, max: 109999, count: 22404 },
  { min: 110000, max: 114999, count: 18580 },
  { min: 115000, max: 119999, count: 15773 },
  { min: 120000, max: 124999, count: 12849 },
  { min: 125000, max: 129999, count: 11183 },
  { min: 130000, max: 134999, count: 8504 },
  { min: 135000, max: 139999, count: 7153 },
  { min: 140000, max: 144999, count: 6347 },
  { min: 145000, max: 150000, count: 5228 },
  { min: 150000, max: 154999, count: 4721 },
  { min: 155000, max: 159999, count: 3398 },
  { min: 160000, max: 164999, count: 3198 },
  { min: 165000, max: 169999, count: 2873 },
  { min: 170000, max: 174999, count: 2212 },
  { min: 175000, max: 179999, count: 1990 },
  { min: 180000, max: 184999, count: 1686 },
  { min: 185000, max: 189999, count: 1392 },
  { min: 190000, max: 194999, count: 1230 },
  { min: 195000, max: 200000, count: 1010 },
];

// Constants for 2024/2025 tax estimation
export const G_BASE = 124028; // 1G (Grunnbeløp estimate)
export const AGA_RATE = 0.141; // Arbeidsgiveravgift (Zone 1)
export const TRYGDEAVGIFT_RATE = 0.078; // Employee social security
export const MINSTEFRADRAG_RATE = 0.46;
export const MINSTEFRADRAG_MAX = 104450;
export const MINSTEFRADRAG_MIN = 31800; // Approx floor 2024
export const PERSONFRADRAG = 88250;
export const GENERAL_TAX_RATE = 0.22;

// Bracket tax (Trinnskatt 2024 estimates)
export const BRACKETS = [
  { limit: 208050, rate: 0.017 },
  { limit: 292850, rate: 0.040 },
  { limit: 670000, rate: 0.136 },
  { limit: 937900, rate: 0.166 },
  { limit: 1350000, rate: 0.176 },
];

