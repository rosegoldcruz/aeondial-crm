import Link from "next/link"

export default function NewLeadPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "var(--cyber-bg-darkest, #0a0a0f)" }}>
      <h1 className="text-xl font-bold text-white mb-2">New Lead</h1>
      <p className="text-sm text-[#525252] mb-6">Coming soon.</p>
      <Link
        href="/leads"
        className="px-4 py-2 bg-[#FF6B35] text-white text-sm font-medium rounded-lg hover:bg-[#e55a2b] transition-colors"
      >
        Back to Leads
      </Link>
    </div>
  )
}
