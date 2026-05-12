import { useReducer, useCallback, useEffect, useRef } from 'react'
import type { ControlState, VideoCallState, VideoCallAction } from '@shared/types'

const initialControls: ControlState = {
  micEnabled: true,
  speakerEnabled: true,
  cameraEnabled: true,
  chatOpen: false,
  isPipMode: true,
}

const initialState: VideoCallState = {
  callState: 'idle',
  aiStatus: 'idle',
  controls: initialControls,
  duration: 0,
  error: null,
}

function videoCallReducer(state: VideoCallState, action: VideoCallAction): VideoCallState {
  switch (action.type) {
    case 'START_CALL':
      return { ...state, callState: 'calling', error: null }

    case 'CONNECT':
      return { ...state, callState: 'connecting' }

    case 'CONNECTED':
      return { ...state, callState: 'connected', duration: 0 }

    case 'END_CALL':
      return { ...state, callState: 'ended' }

    case 'SET_AI_STATUS':
      return { ...state, aiStatus: action.payload }

    case 'TOGGLE_MIC':
      return {
        ...state,
        controls: { ...state.controls, micEnabled: !state.controls.micEnabled },
      }

    case 'TOGGLE_SPEAKER':
      return {
        ...state,
        controls: { ...state.controls, speakerEnabled: !state.controls.speakerEnabled },
      }

    case 'TOGGLE_CAMERA':
      return {
        ...state,
        controls: { ...state.controls, cameraEnabled: !state.controls.cameraEnabled },
      }

    case 'TOGGLE_CHAT':
      return {
        ...state,
        controls: { ...state.controls, chatOpen: !state.controls.chatOpen },
      }

    case 'SET_PIP':
      return {
        ...state,
        controls: { ...state.controls, isPipMode: action.payload },
      }

    case 'SET_ERROR':
      return { ...state, error: action.payload }

    case 'TICK':
      return { ...state, duration: state.duration + 1 }

    case 'RESET':
      return { ...initialState }

    default:
      return state
  }
}

export interface UseVideoCallStateReturn {
  state: VideoCallState
  dispatch: React.Dispatch<VideoCallAction>
  startCall: () => void
  endCall: () => void
  toggleMic: () => void
  toggleSpeaker: () => void
  toggleCamera: () => void
  toggleChat: () => void
}

export function useVideoCallState(): UseVideoCallStateReturn {
  const [state, dispatch] = useReducer(videoCallReducer, initialState)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 通话计时：connected 时每秒 +1，ended 时停止
  useEffect(() => {
    if (state.callState === 'connected') {
      timerRef.current = setInterval(() => {
        dispatch({ type: 'TICK' })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [state.callState])

  const startCall = useCallback(() => {
    dispatch({ type: 'START_CALL' })
  }, [])

  const endCall = useCallback(() => {
    dispatch({ type: 'END_CALL' })
  }, [])

  const toggleMic = useCallback(() => {
    dispatch({ type: 'TOGGLE_MIC' })
  }, [])

  const toggleSpeaker = useCallback(() => {
    dispatch({ type: 'TOGGLE_SPEAKER' })
  }, [])

  const toggleCamera = useCallback(() => {
    dispatch({ type: 'TOGGLE_CAMERA' })
  }, [])

  const toggleChat = useCallback(() => {
    dispatch({ type: 'TOGGLE_CHAT' })
  }, [])

  return {
    state,
    dispatch,
    startCall,
    endCall,
    toggleMic,
    toggleSpeaker,
    toggleCamera,
    toggleChat,
  }
}
