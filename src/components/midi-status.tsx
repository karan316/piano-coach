import { Piano, Keyboard } from 'lucide-react'

interface MidiStatusProps {
  isConnected: boolean
  deviceName: string | null
  isSupported: boolean
}

export function MidiStatus({ isConnected, deviceName, isSupported }: MidiStatusProps) {
  if (!isSupported) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs dark:bg-gray-800">
        <Keyboard size={14} className="text-gray-400" />
        <span className="text-gray-500 dark:text-gray-400">Use keys A-K</span>
      </div>
    )
  }

  if (isConnected) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs dark:bg-emerald-900/30">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <Piano size={14} className="text-emerald-600 dark:text-emerald-400" />
        <span className="font-medium text-emerald-700 dark:text-emerald-300">{deviceName ?? 'Piano Connected'}</span>
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs dark:bg-gray-800">
      <span className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
      <Piano size={14} className="text-gray-400" />
      <span className="text-gray-500 dark:text-gray-400">No Piano</span>
      <span className="text-gray-300 dark:text-gray-600">·</span>
      <Keyboard size={12} className="text-gray-400" />
      <span className="text-gray-400">A-K</span>
    </div>
  )
}
