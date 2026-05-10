import { useState, useCallback, useRef } from 'react'

export interface UseTTSReturn {
  speak: (text: string) => void
  stop: () => void
  isSpeaking: boolean
  isSupported: boolean
  setVoice: (voice: SpeechSynthesisVoice) => void
  setRate: (rate: number) => void
  setPitch: (pitch: number) => void
  voices: SpeechSynthesisVoice[]
  currentVoice: SpeechSynthesisVoice | null
  rate: number
  pitch: number
}

export function useTTS(): UseTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [rate, setRateState] = useState(1)
  const [pitch, setPitchState] = useState(1)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  // 加载语音列表（使用 useState 惰性初始化，只执行一次）
  useState(() => {
    if (!isSupported) return
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices()
      if (allVoices.length > 0) {
        setVoices(allVoices)
        // 默认选择中文女声
        const zhVoice = allVoices.find(v => v.lang.startsWith('zh'))
        if (zhVoice) setCurrentVoice(zhVoice)
        else if (allVoices.length > 0) setCurrentVoice(allVoices[0])
      }
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
  })

  const speak = useCallback((text: string) => {
    if (!isSupported || !text) return

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = rate
    utterance.pitch = pitch
    if (currentVoice) utterance.voice = currentVoice

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [isSupported, rate, pitch, currentVoice])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setCurrentVoice(voice)
  }, [])

  const setRate = useCallback((newRate: number) => {
    setRateState(newRate)
  }, [])

  const setPitch = useCallback((newPitch: number) => {
    setPitchState(newPitch)
  }, [])

  return {
    speak, stop, isSpeaking, isSupported,
    setVoice, setRate, setPitch,
    voices, currentVoice, rate, pitch,
  }
}
