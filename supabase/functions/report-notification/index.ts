// Edge Function: report-notification
// Recibe los datos de un reporte y notifica al admin por mail vía Resend.
// Secrets requeridos (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY  — API key de Resend (re_...)
//   ADMIN_EMAIL     — destinatario de las notificaciones
//   REPORT_FROM     — opcional; remitente (default: onboarding@resend.dev en modo test)

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
  const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL")
  const FROM = Deno.env.get("REPORT_FROM") ?? "ForoITBA <onboarding@resend.dev>"

  if (!RESEND_API_KEY || !ADMIN_EMAIL) {
    return new Response(
      JSON.stringify({ error: "Faltan secrets (RESEND_API_KEY / ADMIN_EMAIL)" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return new Response("Bad JSON", { status: 400 })
  }

  const {
    targetType,
    targetId,
    reason,
    subjectName,
    subjectCode,
    content,
    path,
  } = payload as {
    targetType?: string
    targetId?: string
    reason?: string | null
    subjectName?: string | null
    subjectCode?: string | null
    content?: string | null
    path?: string | null
  }

  const tipo = targetType === "review" ? "reseña" : "aporte"
  const materia = subjectName
    ? `${subjectName}${subjectCode ? ` (${subjectCode})` : ""}`
    : subjectCode ?? "—"

  const text = [
    `Se reportó un ${tipo} en ForoITBA.`,
    ``,
    `Materia: ${materia}`,
    `Motivo: ${reason ?? "(sin especificar)"}`,
    content ? `\nContenido reportado:\n"${content}"` : null,
    ``,
    `Referencia: ${targetType} / ${targetId}`,
    path ? `Ver materia: ${path}` : null,
  ]
    .filter((l) => l !== null)
    .join("\n")

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [ADMIN_EMAIL],
      subject: `[ForoITBA] Reporte de ${tipo}`,
      text,
    }),
  })

  const body = await res.text()
  return new Response(body, {
    status: res.ok ? 200 : res.status,
    headers: { "Content-Type": "application/json" },
  })
})
