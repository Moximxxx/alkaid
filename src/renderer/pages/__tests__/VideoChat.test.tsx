import { render, screen } from '@testing-library/react'
import { VideoChatPage } from '../VideoChat'
import { describe, it, expect, vi } from 'vitest'

// Mock 所有依赖的 hooks
const mockSettings = {
  visionProvider: 'doubao_vision' as const,
  visionApiKey: '',
  visionModel: 'doubao-2.0-vision-pro',
  textProvider: 'openai' as const,
  textApiKey: '',
  textModel: 'gpt-4',
  cameraResolution: '1280x720',
  cameraFps: 30,
  cameraMirror: false,
  ttsEnabled: true,
  ttsRate: 1,
  ttsPitch: 1,
  ttsVoiceURI: '',
  setupCompleted: true,
}

vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({ settings: mockSettings }),
}))

vi.mock('@/hooks/useVideoChat', () => ({
  useVideoChat: () => ({
    stream: null,
    messages: [],
    loading: false,
    sendMessage: vi.fn(),
    isListening: false,
    isTTSSpeaking: false,
    isVADSupported: false,
    startVAD: vi.fn(),
    stopVAD: vi.fn(),
    isInterrupted: false,
    resetInterrupt: vi.fn(),
    startVisionPipeline: vi.fn(),
    stopVisionPipeline: vi.fn(),
    startCamera: vi.fn().mockResolvedValue(true),
    stopCamera: vi.fn(),
  }),
}))

const mockDispatch = vi.fn()
vi.mock('@/hooks/useVideoCallState', () => ({
  useVideoCallState: () => ({
    state: {
      callState: 'idle',
      aiStatus: 'idle',
      duration: 0,
      controls: {
        micEnabled: true,
        speakerEnabled: true,
        cameraEnabled: true,
        chatOpen: false,
        isPipMode: false,
      },
    },
    dispatch: mockDispatch,
    startCall: vi.fn(),
    endCall: vi.fn(),
    toggleMic: vi.fn(),
    toggleSpeaker: vi.fn(),
    toggleCamera: vi.fn(),
    toggleChat: vi.fn(),
  }),
}))

// Mock 所有子组件避免深层依赖
vi.mock('@/components/VideoCall/CallAlertScreen', () => ({
  CallAlertScreen: ({ isVisible }: { isVisible: boolean }) =>
    isVisible ? <div data-testid="call-alert">CallAlert</div> : null,
}))

vi.mock('@/components/VideoCall/VideoContainer', () => ({
  VideoContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="video-container">{children}</div>
  ),
}))

vi.mock('@/components/VideoCall/LocalPiP', () => ({
  LocalPiP: () => <div data-testid="local-pip" />,
}))

vi.mock('@/components/VideoCall/CallControls', () => ({
  CallControls: () => <div data-testid="call-controls" />,
}))

vi.mock('@/components/VideoCall/AIStatusBar', () => ({
  AIStatusBar: () => <div data-testid="ai-status-bar" />,
}))

vi.mock('@/components/VideoCall/ChatDrawer', () => ({
  ChatDrawer: () => <div data-testid="chat-drawer" />,
}))

describe('VideoChatPage', () => {
  it('renders without crashing', () => {
    const { container } = render(<VideoChatPage />)
    expect(container).toBeDefined()
  })

  it('renders CallAlertScreen when idle', () => {
    render(<VideoChatPage />)
    expect(screen.getByTestId('call-alert')).toBeTruthy()
  })

  it('does not render video container when idle', () => {
    render(<VideoChatPage />)
    expect(screen.queryByTestId('video-container')).toBeNull()
  })

  it('renders ChatDrawer', () => {
    render(<VideoChatPage />)
    expect(screen.getByTestId('chat-drawer')).toBeTruthy()
  })
})
