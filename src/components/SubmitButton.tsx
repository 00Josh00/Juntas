'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function SubmitButton({ children, className }: { children: ReactNode; className?: string }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "px-6 py-3 bg-primary text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md",
        "hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0",
        "disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:bg-primary disabled:cursor-not-allowed",
        className
      )}
    >
      {pending && <Loader2 className="h-5 w-5 animate-spin" />}
      {children}
    </button>
  )
}
