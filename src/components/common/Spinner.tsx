export default function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-500 text-sm">
      <span className="inline-block h-4 w-4 border-2 border-slate-300 border-t-brand rounded-full animate-spin" />
      {label}
    </div>
  )
}
