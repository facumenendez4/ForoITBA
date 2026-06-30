import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { join } from "path"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
})

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function toTitleCase(text: string): string {
  const minorWords = new Set([
    "de",
    "del",
    "y",
    "en",
    "la",
    "el",
    "las",
    "los",
    "sin",
  ])
  return text
    .split(/(\s+|-)/g)
    .map((part, i) => {
      if (/^\s+$/.test(part) || part === "-") return part
      const lower = part.toLowerCase()
      if (i > 0 && minorWords.has(lower)) return lower
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join("")
}

const TERM_PATTERN = /^Año \d+ - Cuatrimestre \d+$/

function isElectiveTerm(term: string): boolean {
  return !TERM_PATTERN.test(term)
}

function normalizeGroupName(term: string): string {
  if (!isElectiveTerm(term)) return term
  return toTitleCase(term)
}

interface CsvRow {
  carrera: string
  cuatrimestre: string
  codigo: string
  materia: string
  creditos: string
  creditos_requeridos: string
  correlativas: string
}

function parseCsv(filepath: string): CsvRow[] {
  const content = readFileSync(filepath, "utf-8")
  const lines = content.trim().split("\n")
  const headers = lines[0].split(",")
  return lines.slice(1).map((line) => {
    const values = line.split(",")
    const row: Record<string, string> = {}
    headers.forEach((h, i) => {
      row[h.trim()] = (values[i] || "").trim()
    })
    return row as unknown as CsvRow
  })
}

async function seed() {
  console.log("Parsing CSV...")
  const rows = parseCsv(join(__dirname, "itba_plan_maestro.csv"))
  console.log(`Total rows: ${rows.length}`)

  // Filter out REVISAR rows
  const revisar = rows.filter(
    (r) => r.codigo === "REVISAR" || r.creditos_requeridos === "REVISAR"
  )
  console.log(`Skipping ${revisar.length} REVISAR rows`)

  // Separate COLAPSADA rows
  const colapsadas = rows.filter((r) => r.codigo === "COLAPSADA")
  console.log(`Found ${colapsadas.length} COLAPSADA rows → elective_groups_pending`)

  // Valid rows
  const validRows = rows.filter(
    (r) =>
      r.codigo !== "REVISAR" &&
      r.codigo !== "COLAPSADA" &&
      r.creditos_requeridos !== "REVISAR"
  )
  console.log(`Valid rows to process: ${validRows.length}`)

  // 1. Extract unique careers
  const careerNames = [...new Set(validRows.map((r) => r.carrera))]
  // Also include careers from COLAPSADA rows
  colapsadas.forEach((r) => {
    if (!careerNames.includes(r.carrera)) careerNames.push(r.carrera)
  })
  console.log(`Careers: ${careerNames.length}`)

  // 2. Extract unique subjects by code
  const subjectMap = new Map<string, string>()
  for (const row of validRows) {
    if (!subjectMap.has(row.codigo)) {
      subjectMap.set(row.codigo, row.materia)
    }
  }
  console.log(`Unique subjects: ${subjectMap.size}`)

  // === UPSERT CAREERS ===
  console.log("\nUpserting careers...")
  const careersData = careerNames.map((name) => ({
    name,
    slug: slugify(name),
  }))

  const { data: careers, error: careersError } = await supabase
    .from("careers")
    .upsert(careersData, { onConflict: "name" })
    .select("id, name, slug")

  if (careersError) {
    console.error("Error upserting careers:", careersError)
    process.exit(1)
  }
  console.log(`  Upserted ${careers.length} careers`)

  const careerIdByName = new Map(careers.map((c) => [c.name, c.id]))

  // === UPSERT SUBJECTS ===
  console.log("Upserting subjects...")
  const subjectsData = [...subjectMap.entries()].map(([code, name]) => ({
    code,
    name,
    slug: slugify(`${code}-${name}`),
  }))

  // Batch in chunks of 200
  for (let i = 0; i < subjectsData.length; i += 200) {
    const batch = subjectsData.slice(i, i + 200)
    const { error } = await supabase
      .from("subjects")
      .upsert(batch, { onConflict: "code" })

    if (error) {
      console.error(`Error upserting subjects batch ${i}:`, error)
      process.exit(1)
    }
  }
  console.log(`  Upserted ${subjectsData.length} subjects`)

  // === UPSERT CAREER_SUBJECTS ===
  console.log("Upserting career_subjects...")
  const careerSubjectsData = validRows.map((row) => {
    const term = row.cuatrimestre
    const isElective = isElectiveTerm(term)
    const electiveGroup = isElective ? normalizeGroupName(term) : null

    const prereqs = row.correlativas
      ? row.correlativas.split("|").map((c) => c.trim()).filter(Boolean)
      : []

    const reqCredits = row.creditos_requeridos
      ? parseInt(row.creditos_requeridos, 10)
      : null

    return {
      career_id: careerIdByName.get(row.carrera)!,
      subject_code: row.codigo,
      credits: parseInt(row.creditos, 10) || 0,
      term: isElective ? normalizeGroupName(term) : term,
      elective_group: electiveGroup,
      is_elective: isElective,
      prerequisites: prereqs,
      required_credits: isNaN(reqCredits!) ? null : reqCredits,
    }
  })

  // Batch in chunks of 200
  for (let i = 0; i < careerSubjectsData.length; i += 200) {
    const batch = careerSubjectsData.slice(i, i + 200)
    const { error } = await supabase
      .from("career_subjects")
      .upsert(batch, { onConflict: "career_id,subject_code" })

    if (error) {
      console.error(`Error upserting career_subjects batch ${i}:`, error)
      console.error("First failing row:", JSON.stringify(batch[0], null, 2))
      process.exit(1)
    }
  }
  console.log(`  Upserted ${careerSubjectsData.length} career_subjects`)

  // === UPSERT ELECTIVE_GROUPS_PENDING ===
  console.log("Upserting elective_groups_pending...")
  const pendingData = colapsadas.map((row) => ({
    career_id: careerIdByName.get(row.carrera)!,
    group_name: normalizeGroupName(row.cuatrimestre),
    required_credits: parseInt(row.creditos, 10) || 0,
  }))

  // Delete existing pending groups first (idempotent)
  await supabase.from("elective_groups_pending").delete().neq("id", "00000000-0000-0000-0000-000000000000")

  if (pendingData.length > 0) {
    const { error } = await supabase
      .from("elective_groups_pending")
      .insert(pendingData)

    if (error) {
      console.error("Error inserting elective_groups_pending:", error)
      process.exit(1)
    }
  }
  console.log(`  Inserted ${pendingData.length} elective_groups_pending`)

  // === SUMMARY ===
  console.log("\n=== SEED COMPLETE ===")
  console.log(`  Careers: ${careers.length}`)
  console.log(`  Subjects: ${subjectsData.length}`)
  console.log(`  Career-Subject links: ${careerSubjectsData.length}`)
  console.log(`  Elective groups pending: ${pendingData.length}`)
  console.log(`  Skipped REVISAR: ${revisar.length}`)
  console.log(`  Skipped COLAPSADA (→ pending): ${colapsadas.length}`)
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
