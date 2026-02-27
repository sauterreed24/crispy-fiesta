import { useState, useEffect, useCallback } from 'react'
import Sidebar, { Page } from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import PromptLab from './pages/PromptLab'
import KnowledgeHub from './pages/KnowledgeHub'
import Challenges from './pages/Challenges'
import SkillBuilder from './pages/SkillBuilder'
import PromptLibrary from './pages/PromptLibrary'
import { get } from './api'

export interface Progress {
  challenges_completed: number
  prompts_evaluated: number
  knowledge_queries: number
  total_xp: number
  current_streak: number
}

const defaultProgress: Progress = {
  challenges_completed: 0,
  prompts_evaluated: 0,
  knowledge_queries: 0,
  total_xp: 0,
  current_streak: 0,
}

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [progress, setProgress] = useState<Progress>(defaultProgress)

  const loadProgress = useCallback(async () => {
    try {
      const data = await get<Progress>('/progress')
      setProgress(data)
    } catch {
      // Backend may not be ready yet
    }
  }, [])

  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard progress={progress} onNavigate={setPage} />
      case 'prompt-lab':
        return <PromptLab onProgressUpdate={loadProgress} />
      case 'knowledge':
        return <KnowledgeHub onProgressUpdate={loadProgress} />
      case 'challenges':
        return <Challenges onProgressUpdate={loadProgress} />
      case 'skill-builder':
        return <SkillBuilder />
      case 'library':
        return <PromptLibrary />
    }
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <Sidebar currentPage={page} onNavigate={setPage} progress={progress} />
      <main className="flex-1 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  )
}
