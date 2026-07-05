import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ZIP_URL = 'https://nces.ed.gov/surveys/pss/zip/pss2122_pu_csv.zip'
const DATA_DIR = join(process.cwd(), '.data')
const CSV_PATH = join(DATA_DIR, 'pss2122_pu.csv')
const ZIP_PATH = join(DATA_DIR, 'pss2122_pu_csv.zip')

/** Return the NCES PSS CSV text, downloading + unzipping into .data/ on first run. */
export async function loadNcesCsv(): Promise<string> {
  if (existsSync(CSV_PATH)) return readFileSync(CSV_PATH, 'utf8')
  mkdirSync(DATA_DIR, { recursive: true })
  console.log('Downloading NCES PSS 2021-22 CSV (~4 MB zip)…')
  const res = await fetch(ZIP_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) throw new Error(`NCES download failed: ${res.status}`)
  writeFileSync(ZIP_PATH, Buffer.from(await res.arrayBuffer()))
  execFileSync('unzip', ['-o', ZIP_PATH, '-d', DATA_DIR], { stdio: 'ignore' })
  if (!existsSync(CSV_PATH)) throw new Error('unzip did not produce pss2122_pu.csv')
  return readFileSync(CSV_PATH, 'utf8')
}
