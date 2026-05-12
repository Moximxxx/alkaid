import { useState, useCallback, useRef, useEffect } from 'react'

// 浏览器 SpeechRecognition 构造器类型
interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance
}

// 浏览器 SpeechRecognition 实例类型
interface SpeechRecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

interface SpeechRecognitionResultEvent {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent {
  error: string
}

interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

export interface UseSpeechRecognitionReturn {
  isListening: boolean
  transcript: string
  interimTranscript: string
  isSupported: boolean
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  error: string | null
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  useEffect(() => {
    const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition as SpeechRecognitionConstructor | undefined
      || (window as unknown as Record<string, unknown>).webkitSpeechRecognition as SpeechRecognitionConstructor | undefined
    if (SpeechRecognition) {
      setIsSupported(true)
      const recognition = new SpeechRecognition()
      recognition.lang = 'zh-CN'
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onresult = (event: SpeechRecognitionResultEvent) => {
        let final = ''
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            final += result[0].transcript
          } else {
            interim += result[0].transcript
          }
        }
        if (final) {
          setTranscript(prev => prev + final)
        }
        setInterimTranscript(interim)
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setError(`语音识别错误: ${event.error}`)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [])

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current
    if (recognition && !isListening) {
      try {
        recognition.start()
        setIsListening(true)
        setError(null)
      } catch {
        setError('启动语音识别失败')
      }
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current
    if (recognition && isListening) {
      recognition.stop()
      setIsListening(false)
    }
  }, [isListening])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
  }, [])

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error,
  }
}
