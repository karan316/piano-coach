import { Music } from 'lucide-react'
import { useTheme } from '#/hooks/use-theme'
import { useMidi } from '#/hooks/use-midi'
import { MidiStatus } from './midi-status'
import { ThemeToggle } from './theme-toggle'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { isDark, toggleTheme } = useTheme()
  const midi = useMidi()

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF8F5] text-gray-900 transition-colors dark:bg-[#0F1729] dark:text-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200/60 px-4 py-3 dark:border-gray-800/60">
        {/* Logo / Title */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 text-white">
            <Music size={16} />
          </div>
          <h1 className="font-display text-xl tracking-tight text-gray-800 dark:text-gray-100">
            Piano Coach
          </h1>
          <span className="text-xs text-gray-300 dark:text-gray-600">♪</span>
        </div>

        {/* Right side: MIDI status + theme toggle */}
        <div className="flex items-center gap-3">
          <MidiStatus
            isConnected={midi.isConnected}
            deviceName={midi.deviceName}
            isSupported={midi.isSupported}
          />
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>

      {/* Subtle musical watermark in background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-[0.02] dark:opacity-[0.03]" aria-hidden="true">
        <div className="absolute top-1/4 -left-8 text-[200px] font-serif text-gray-900 dark:text-white -rotate-12">
          𝄞
        </div>
        <div className="absolute bottom-1/4 -right-8 text-[160px] font-serif text-gray-900 dark:text-white rotate-12">
          ♪
        </div>
      </div>
    </div>
  )
}
