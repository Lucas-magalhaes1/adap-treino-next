'use client'

import { useEffect, useRef, useState } from 'react'

export function useStopwatch(startTime?: string) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout>(null)

  useEffect(() => {
    if (!startTime) return

    const start = new Date(startTime).getTime()

    // Calcular tempo já decorrido
    const calculateElapsed = () => {
      const now = Date.now()
      return Math.floor((now - start) / 1000)
    }

    // Atualizar imediatamente
    setElapsedSeconds(calculateElapsed())

    // Atualizar a cada segundo
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(calculateElapsed())
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [startTime])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return {
    elapsedSeconds,
    formattedTime: formatTime(elapsedSeconds),
  }
}
