// 摄像头管理服务

export class CameraService {
  private stream: MediaStream | null = null
  private videoElement: HTMLVideoElement | null = null

  // 初始化摄像头
  async initialize(deviceId?: string): Promise<boolean> {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
        },
        audio: false,
      }

      this.stream = await navigator.mediaDevices.getUserMedia(constraints)
      return true
    } catch (error) {
      console.error('摄像头初始化失败:', error)
      return false
    }
  }

  // 获取视频流
  getStream(): MediaStream | null {
    return this.stream
  }

  // 捕获当前帧
  captureFrame(): string | null {
    if (!this.videoElement) return null

    const canvas = document.createElement('canvas')
    canvas.width = this.videoElement.videoWidth
    canvas.height = this.videoElement.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(this.videoElement, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.8)
  }

  // 获取可用设备列表
  async getDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter(device => device.kind === 'videoinput')
  }

  // 停止摄像头
  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
  }

  // 绑定视频元素
  bindVideoElement(element: HTMLVideoElement): void {
    this.videoElement = element
    if (this.stream) {
      element.srcObject = this.stream
    }
  }
}

// 导出单例
export const cameraService = new CameraService()
