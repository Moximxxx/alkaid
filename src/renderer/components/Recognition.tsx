// 识别结果组件

import React from 'react'
import type { RecognitionResult } from '@shared/types'

interface RecognitionProps {
  result: RecognitionResult | null
  loading?: boolean
}

export const Recognition: React.FC<RecognitionProps> = ({
  result,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <div className="animate-pulse">识别中...</div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg text-gray-500">
        等待识别...
      </div>
    )
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="font-semibold mb-2">识别结果</h3>

      {/* 场景描述 */}
      {result.scene.description && (
        <div className="mb-3">
          <p className="text-sm text-gray-600">场景描述:</p>
          <p className="text-sm">{result.scene.description}</p>
        </div>
      )}

      {/* 标签 */}
      {result.scene.tags.length > 0 && (
        <div className="mb-3">
          <p className="text-sm text-gray-600">标签:</p>
          <div className="flex flex-wrap gap-1">
            {result.scene.tags.slice(0, 5).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 检测到的物体 */}
      {result.objects.length > 0 && (
        <div className="mb-3">
          <p className="text-sm text-gray-600">检测到的物体:</p>
          <ul className="text-sm">
            {result.objects.slice(0, 5).map((obj, index) => (
              <li key={index} className="flex justify-between">
                <span>{obj.name}</span>
                <span className="text-gray-500">
                  {Math.round(obj.confidence * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 检测到的人脸 */}
      {result.faces.length > 0 && (
        <div>
          <p className="text-sm text-gray-600">检测到的人脸: {result.faces.length}个</p>
          {result.faces[0].age && (
            <p className="text-sm">估计年龄: {result.faces[0].age}岁</p>
          )}
          {result.faces[0].emotion && (
            <p className="text-sm">情绪: {result.faces[0].emotion}</p>
          )}
        </div>
      )}

      {/* 时间戳 */}
      <p className="text-xs text-gray-400 mt-2">
        {new Date(result.timestamp).toLocaleTimeString()}
      </p>
    </div>
  )
}

export default Recognition
