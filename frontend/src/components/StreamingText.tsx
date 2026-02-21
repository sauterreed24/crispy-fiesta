import { useEffect, useRef } from 'react'
import { markdownToHtml } from '../api'

interface StreamingTextProps {
  text: string
  isStreaming: boolean
  className?: string
}

export default function StreamingText({ text, isStreaming, className = '' }: StreamingTextProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [text])

  const html = markdownToHtml(text)

  return (
    <div
      ref={ref}
      className={`ai-output ${className}`}
      dangerouslySetInnerHTML={{
        __html: html + (isStreaming ? '<span class="cursor-blink"></span>' : '')
      }}
    />
  )
}
