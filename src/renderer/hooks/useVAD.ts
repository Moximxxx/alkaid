// 基于 Web Audio API 的语音活动检测（Voice Activity Detection）Hook

import { useState, useEffect, useCallback, useRef } from 'react'
import { PIPELINE_DEFAULTS } from '@shared/constants'
import { logger } from '@shared/logger'

export interface UseVADOptions {
  stream: MediaStream | null
  threshold?: number
  silenceTimeoutMs?: number
  onSpeechStart?: () => void
  onSpeechEnd?: () => void
}

export interface UseVADReturn {
  isSpeaking: boolean
  isSupported: boolean
  startMonitoring: () => void
  stopMonitoring: () => void
}

/**
 * useVAD — 基于 Web Audio API 的语音活动检测
 *
 * 使用 AudioContext + AnalyserNode 分析麦克风音频，
 * 每 100ms 读取频域数据计算 RMS 能量，
 * 能量超过 threshold → isSpeaking = true
 * 能量低于 threshold 持续 silenceTimeoutMs → isSpeaking = false
 */
export function useVAD(options: UseVADOptions): UseVADReturn {
  const {
    stream,
    threshold = PIPELINE_DEFAULTS.vadThreshold,
    silenceTimeoutMs = PIPELINE_DEFAULTS.vadSilenceTimeoutMs ?? 500,
    onSpeechStart,
    onSpeechEnd,
  } = options

  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const animationRef = useRef<number | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const speakingRef = useRef(false)
  const isMonitoringRef = useRef(false)

  // 检查 AudioContext 可用性
  useEffect(() => {
    const supported = typeof AudioContext !== 'undefined'
      || typeof (window as unknown as Record<string, unknown>).webkitAudioContext !== 'undefined'
    setIsSupported(supported)
  }, [])

  // 计算 RMS 能量
  const calculateRMS = useCallback((dataArray: Uint8Array): number => {
    let sum = 0
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = dataArray[i] / 128 - 1 // 归一化到 [-1, 1]
      sum += normalized * normalized
    }
    const rms = Math.sqrt(sum / dataArray.length)
    return rms
  }, [])

  // 音频分析循环
  const analyzeAudio = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser || !isMonitoringRef.current) return

    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteTimeDomainData(dataArray)
    const rms = calculateRMS(dataArray)

    if (rms > threshold) {
      // 检测到语音
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
      if (!speakingRef.current) {
        speakingRef.current = true
        setIsSpeaking(true)
        onSpeechStart?.()
      }
    } else {
      // 静音 — 启动计时器
      if (speakingRef.current && !silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          speakingRef.current = false
          setIsSpeaking(false)
          silenceTimerRef.current = null
          onSpeechEnd?.()
        }, silenceTimeoutMs)
      }
    }

    animationRef.current = requestAnimationFrame(analyzeAudio)
  }, [threshold, silenceTimeoutMs, calculateRMS, onSpeechStart, onSpeechEnd])

  // 开始监控
  const startMonitoring = useCallback(() => {
    if (!stream || isMonitoringRef.current) return

    try {
      const AudioCtx = AudioContext || (window as unknown as Record<string, unknown>).webkitAudioContext as typeof AudioContext
      if (!AudioCtx) return

      const audioContext = new AudioCtx()
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      const source = audioContext.createMediaStreamSource(stream)

      source.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser
      sourceRef.current = source
      isMonitoringRef.current = true

      analyzeAudio()
    } catch (err) {
      logger.error('[VAD] 启动监控失败:', err)
    }
  }, [stream, analyzeAudio])

  // 停止监控
  const stopMonitoring = useCallback(() => {
    isMonitoringRef.current = false

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect()
      sourceRef.current = null
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    analyserRef.current = null
    speakingRef.current = false
    setIsSpeaking(false)
  }, [])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopMonitoring()
    }
  }, [stopMonitoring])

  return {
    isSpeaking,
    isSupported,
    startMonitoring,
    stopMonitoring,
  }
}
