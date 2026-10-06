export default function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-white rounded-xl shadow p-10 text-center text-slate-400">{text}</div>
  )
}
