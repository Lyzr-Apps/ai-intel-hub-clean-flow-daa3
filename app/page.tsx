'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  HiOutlineMagnifyingGlass,
  HiOutlineDocumentText,
  HiOutlineUserGroup,
  HiOutlineChartBarSquare,
  HiOutlineClipboardDocumentCheck,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineArrowDownTray,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExclamationTriangle,
  HiOutlineArrowPath,
  HiOutlineFunnel,
  HiOutlineGlobeAlt,
  HiOutlineClock,
  HiOutlineBolt,
  HiOutlineEye,
  HiOutlineDocumentArrowDown,
  HiOutlineInformationCircle,
  HiOutlineChevronRight,
} from 'react-icons/hi2'

// --- Constants ---
const DISCOVERY_AGENT_ID = '699e51bb03e99fdcfa03917a'
const REPORT_AGENT_ID = '699e51cecc6fce723cd133a3'

const LS_COMPETITORS = 'cih_competitors'
const LS_FINDINGS = 'cih_findings'
const LS_REPORTS = 'cih_reports'
const LS_DISCOVERY_HISTORY = 'cih_discovery_history'

// --- TypeScript Interfaces ---
interface Competitor {
  id: string
  name: string
  dateAdded: string
}

interface Finding {
  id: string
  competitor_name: string
  title: string
  description: string
  url: string
  source_name: string
  site_type: string
  engagement_type: string
  media_type: string
  confidence_score: number
  status: string
  flag_reason: string
  published_date: string
  content_snippet: string
  batchDate: string
}

interface CompetitorAnalysis {
  competitor_name: string
  total_findings: number
  activity_summary: string
  key_developments: string
  source_distribution: string
  engagement_distribution: string
  notable_excerpts: string
}

interface StoredReport {
  id: string
  month: string
  year: string
  generatedDate: string
  totalFindings: number
  totalCompetitors: number
  executiveSummary: string
  landscapeOverview: string
  trendAnalysis: string
  recommendations: string
  competitorAnalyses: CompetitorAnalysis[]
  pdfUrl: string
  summary: string
}

interface DiscoveryRun {
  id: string
  date: string
  totalFindings: number
  autoApproved: number
  flagged: number
  xlsxUrl: string
}

type ScreenName = 'dashboard' | 'competitors' | 'findings' | 'reports'

// --- Sample Data ---
const SAMPLE_COMPETITORS: Competitor[] = [
  { id: 's1', name: 'OpenAI', dateAdded: '2025-01-15' },
  { id: 's2', name: 'Google DeepMind', dateAdded: '2025-01-15' },
  { id: 's3', name: 'Anthropic', dateAdded: '2025-01-20' },
  { id: 's4', name: 'Mistral AI', dateAdded: '2025-02-01' },
  { id: 's5', name: 'Cohere', dateAdded: '2025-02-10' },
]

const SAMPLE_FINDINGS: Finding[] = [
  { id: 'sf1', competitor_name: 'OpenAI', title: 'GPT-5 Architecture Leaked in Research Paper', description: 'A recent arXiv paper co-authored by OpenAI researchers hints at the architecture behind GPT-5, showing a significant shift toward mixture-of-experts models.', url: 'https://arxiv.org/example', source_name: 'arXiv', site_type: 'Research', engagement_type: 'Publication', media_type: 'Text', confidence_score: 0.92, status: 'Auto-Approved', flag_reason: '', published_date: '2025-02-20', content_snippet: 'The proposed architecture leverages sparse mixture-of-experts...', batchDate: '2025-02-22' },
  { id: 'sf2', competitor_name: 'Google DeepMind', title: 'Gemini 2.5 Enterprise Launch Announcement', description: 'Google announces Gemini 2.5 for enterprise with advanced multimodal capabilities and improved reasoning.', url: 'https://blog.google/example', source_name: 'Google Blog', site_type: 'Corporate Blog', engagement_type: 'Product Launch', media_type: 'Text', confidence_score: 0.97, status: 'Auto-Approved', flag_reason: '', published_date: '2025-02-18', content_snippet: 'Gemini 2.5 represents our most capable enterprise model...', batchDate: '2025-02-22' },
  { id: 'sf3', competitor_name: 'Anthropic', title: 'Constitutional AI Framework Update', description: 'Anthropic publishes updated constitutional AI training guidelines with emphasis on harmlessness.', url: 'https://anthropic.com/example', source_name: 'Anthropic Research', site_type: 'Research', engagement_type: 'Publication', media_type: 'Text', confidence_score: 0.88, status: 'Auto-Approved', flag_reason: '', published_date: '2025-02-15', content_snippet: 'Our updated constitutional approach focuses on...', batchDate: '2025-02-22' },
  { id: 'sf4', competitor_name: 'Mistral AI', title: 'Mistral Raises $600M Series C', description: 'Mistral AI closes a $600M funding round at a $6B valuation, signaling aggressive expansion plans.', url: 'https://techcrunch.com/example', source_name: 'TechCrunch', site_type: 'News', engagement_type: 'Funding', media_type: 'Text', confidence_score: 0.78, status: 'Flagged', flag_reason: 'Funding amount unconfirmed by primary source', published_date: '2025-02-12', content_snippet: 'The Paris-based AI startup has reportedly closed...', batchDate: '2025-02-22' },
  { id: 'sf5', competitor_name: 'OpenAI', title: 'OpenAI Developer Conference Keynote', description: 'Sam Altman presents new developer tools and API pricing restructuring at the OpenAI annual conference.', url: 'https://openai.com/example', source_name: 'OpenAI Events', site_type: 'Conference', engagement_type: 'Event', media_type: 'Video', confidence_score: 0.95, status: 'Auto-Approved', flag_reason: '', published_date: '2025-02-10', content_snippet: 'Today we are announcing fundamental changes to our API...', batchDate: '2025-02-22' },
  { id: 'sf6', competitor_name: 'Cohere', title: 'Cohere Command R+ Benchmark Claims', description: 'Cohere claims Command R+ outperforms GPT-4 on enterprise retrieval tasks, raising industry eyebrows.', url: 'https://cohere.ai/example', source_name: 'Cohere Blog', site_type: 'Corporate Blog', engagement_type: 'Product Update', media_type: 'Text', confidence_score: 0.65, status: 'Flagged', flag_reason: 'Benchmark methodology not independently verified', published_date: '2025-02-08', content_snippet: 'Command R+ demonstrates superior performance on...', batchDate: '2025-02-22' },
  { id: 'sf7', competitor_name: 'Google DeepMind', title: 'AlphaFold 3 Drug Discovery Partnership', description: 'DeepMind partners with Eli Lilly to use AlphaFold 3 in clinical drug discovery pipelines.', url: 'https://nature.com/example', source_name: 'Nature', site_type: 'Research', engagement_type: 'Partnership', media_type: 'Text', confidence_score: 0.91, status: 'Auto-Approved', flag_reason: '', published_date: '2025-02-05', content_snippet: 'The collaboration will leverage AlphaFold 3 predictions...', batchDate: '2025-02-22' },
]

const SAMPLE_REPORTS: StoredReport[] = [
  {
    id: 'sr1', month: 'January', year: '2025', generatedDate: '2025-02-01', totalFindings: 34, totalCompetitors: 5,
    executiveSummary: 'January 2025 saw heightened activity across the AI competitive landscape. OpenAI maintained its lead with significant developer tooling updates, while Google DeepMind pushed forward with enterprise Gemini offerings. Anthropic continued its safety-focused approach, and Mistral AI made waves in the European market.',
    landscapeOverview: 'The competitive landscape remains dynamic with five major players vying for enterprise and developer mindshare. Key themes include multimodal capabilities, safety/alignment research, and pricing competition.',
    trendAnalysis: 'Three dominant trends emerged: (1) Shift toward mixture-of-experts architectures for efficiency, (2) Increased focus on enterprise-specific deployments, (3) Growing emphasis on AI safety and regulation preparedness.',
    recommendations: 'Focus competitive monitoring on enterprise pricing strategies and API capability gaps. Increase tracking of regulatory developments in EU and US markets. Monitor partnership announcements closely for market positioning signals.',
    competitorAnalyses: [
      { competitor_name: 'OpenAI', total_findings: 12, activity_summary: 'High activity with product launches and developer outreach', key_developments: 'GPT-5 hints, API restructuring, DevDay announcements', source_distribution: 'Research: 3, News: 5, Blog: 2, Conference: 2', engagement_distribution: 'Product Launch: 4, Publication: 3, Event: 3, Partnership: 2', notable_excerpts: 'Fundamental changes to API pricing signal a shift toward volume-based enterprise deals.' },
      { competitor_name: 'Google DeepMind', total_findings: 9, activity_summary: 'Strong research output combined with enterprise push', key_developments: 'Gemini 2.5 enterprise, AlphaFold 3 partnerships', source_distribution: 'Research: 4, News: 3, Blog: 2', engagement_distribution: 'Product Launch: 2, Publication: 4, Partnership: 3', notable_excerpts: 'DeepMind continues to bridge research and commercial applications effectively.' },
    ],
    pdfUrl: '', summary: 'January 2025 competitive intelligence report covering 34 findings across 5 competitors.'
  },
]

const SAMPLE_DISCOVERY_HISTORY: DiscoveryRun[] = [
  { id: 'sd1', date: '2025-02-22T14:30:00Z', totalFindings: 7, autoApproved: 5, flagged: 2, xlsxUrl: '' },
  { id: 'sd2', date: '2025-02-15T10:15:00Z', totalFindings: 12, autoApproved: 10, flagged: 2, xlsxUrl: '' },
]

// --- Utility Functions ---
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function safeJsonParse(data: unknown): unknown {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch {
      return data
    }
  }
  return data
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return 'N/A'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return dateStr
  }
}

// --- Markdown Renderer ---
function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">
        {part}
      </strong>
    ) : (
      part
    )
  )
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return (
            <h4 key={i} className="font-semibold text-sm mt-3 mb-1">
              {line.slice(4)}
            </h4>
          )
        if (line.startsWith('## '))
          return (
            <h3 key={i} className="font-semibold text-base mt-3 mb-1">
              {line.slice(3)}
            </h3>
          )
        if (line.startsWith('# '))
          return (
            <h2 key={i} className="font-bold text-lg mt-4 mb-2">
              {line.slice(2)}
            </h2>
          )
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <li key={i} className="ml-4 list-disc text-sm">
              {formatInline(line.slice(2))}
            </li>
          )
        if (/^\d+\.\s/.test(line))
          return (
            <li key={i} className="ml-4 list-decimal text-sm">
              {formatInline(line.replace(/^\d+\.\s/, ''))}
            </li>
          )
        if (!line.trim()) return <div key={i} className="h-1" />
        return (
          <p key={i} className="text-sm">
            {formatInline(line)}
          </p>
        )
      })}
    </div>
  )
}

// --- localStorage helpers ---
function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function lsSet(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Silently fail
  }
}

// --- ErrorBoundary ---
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// --- Status Banner ---
function StatusBanner({ message, type, onDismiss }: { message: string; type: 'success' | 'error' | 'info' | 'warning'; onDismiss: () => void }) {
  const colors = {
    success: 'bg-green-50 border-green-300 text-green-800',
    error: 'bg-red-50 border-red-300 text-red-800',
    info: 'bg-blue-50 border-blue-300 text-blue-800',
    warning: 'bg-amber-50 border-amber-300 text-amber-800',
  }
  const icons = {
    success: <HiOutlineCheckCircle className="w-5 h-5" />,
    error: <HiOutlineXCircle className="w-5 h-5" />,
    info: <HiOutlineInformationCircle className="w-5 h-5" />,
    warning: <HiOutlineExclamationTriangle className="w-5 h-5" />,
  }
  return (
    <div className={cn('flex items-center gap-3 px-4 py-3 rounded-lg border mb-4', colors[type])}>
      {icons[type]}
      <span className="text-sm flex-1">{message}</span>
      <button onClick={onDismiss} className="text-current opacity-60 hover:opacity-100">
        <HiOutlineXCircle className="w-4 h-4" />
      </button>
    </div>
  )
}

// --- Sidebar Navigation ---
function SidebarNav({ activeScreen, onNavigate }: { activeScreen: ScreenName; onNavigate: (s: ScreenName) => void }) {
  const navItems: { key: ScreenName; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <HiOutlineChartBarSquare className="w-5 h-5" /> },
    { key: 'competitors', label: 'Competitors', icon: <HiOutlineUserGroup className="w-5 h-5" /> },
    { key: 'findings', label: 'Findings Review', icon: <HiOutlineClipboardDocumentCheck className="w-5 h-5" /> },
    { key: 'reports', label: 'Reports', icon: <HiOutlineDocumentText className="w-5 h-5" /> },
  ]

  return (
    <aside className="w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col min-h-screen">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <HiOutlineBolt className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-sidebar-foreground">Competitor</h1>
            <p className="text-xs text-sidebar-foreground/60">Intelligence Hub</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              activeScreen === item.key
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-sidebar-accent rounded-lg p-3">
          <p className="text-xs font-medium text-sidebar-foreground mb-1">Powered by AI</p>
          <p className="text-xs text-sidebar-foreground/60 leading-relaxed">Discovery Coordinator and Report Generator agents</p>
        </div>
      </div>
    </aside>
  )
}

// --- Metric Tile ---
function MetricTile({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent?: boolean }) {
  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md', accent ? 'border-primary/30' : '')}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', accent ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground')}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// --- Finding Status Badge ---
function FindingStatusBadge({ status }: { status: string }) {
  const s = (status ?? '').toLowerCase()
  if (s.includes('approved') || s === 'auto-approved') {
    return <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100">Approved</Badge>
  }
  if (s.includes('flagged')) {
    return <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100">Flagged</Badge>
  }
  if (s.includes('dismiss')) {
    return <Badge className="bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-100">Dismissed</Badge>
  }
  return <Badge variant="outline">{status ?? 'Unknown'}</Badge>
}

// --- Agent Info Section ---
function AgentInfoSection({ activeAgentId }: { activeAgentId: string | null }) {
  const agents = [
    { id: DISCOVERY_AGENT_ID, name: 'Discovery Coordinator', purpose: 'Orchestrates competitor content discovery, classification, and batch export' },
    { id: REPORT_AGENT_ID, name: 'Monthly Report Generator', purpose: 'Generates comprehensive PDF reports with trend analysis and competitor overviews' },
  ]
  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">AI Agents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {agents.map((a) => (
          <div key={a.id} className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full', activeAgentId === a.id ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30')} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{a.name}</p>
              <p className="text-xs text-muted-foreground truncate">{a.purpose}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ============================
// SCREEN: Dashboard
// ============================
function DashboardScreen({
  competitors,
  findings,
  reports,
  discoveryHistory,
  onRunDiscovery,
  discoveryLoading,
  activeAgentId,
  onNavigate,
}: {
  competitors: Competitor[]
  findings: Finding[]
  reports: StoredReport[]
  discoveryHistory: DiscoveryRun[]
  onRunDiscovery: () => void
  discoveryLoading: boolean
  activeAgentId: string | null
  onNavigate: (s: ScreenName) => void
}) {
  const flaggedCount = findings.filter((f) => (f.status ?? '').toLowerCase().includes('flagged')).length
  const lastRun = discoveryHistory.length > 0 ? discoveryHistory[0] : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Your competitive intelligence overview at a glance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile icon={<HiOutlineUserGroup className="w-5 h-5" />} label="Competitors Tracked" value={competitors.length} accent />
        <MetricTile icon={<HiOutlineMagnifyingGlass className="w-5 h-5" />} label="Findings This Week" value={findings.length} />
        <MetricTile icon={<HiOutlineExclamationTriangle className="w-5 h-5" />} label="Flagged Pending" value={flaggedCount} />
        <MetricTile icon={<HiOutlineDocumentText className="w-5 h-5" />} label="Reports Generated" value={reports.length} />
      </div>

      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Run Discovery Scan</h3>
              <p className="text-sm text-muted-foreground">
                {competitors.length === 0
                  ? 'Add competitors first, then run discovery to scan for AI-related content.'
                  : `Scan across web, media, social, and conference sources for ${competitors.length} competitor${competitors.length === 1 ? '' : 's'}.`}
              </p>
              {lastRun && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <HiOutlineClock className="w-3 h-3" />
                  Last run: {formatDateTime(lastRun.date)} - {lastRun.totalFindings} findings
                </p>
              )}
            </div>
            <Button
              onClick={onRunDiscovery}
              disabled={discoveryLoading || competitors.length === 0}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
              size="lg"
            >
              {discoveryLoading ? (
                <>
                  <HiOutlineArrowPath className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <HiOutlineMagnifyingGlass className="w-4 h-4 mr-2" />
                  Run Discovery
                </>
              )}
            </Button>
          </div>
          {discoveryLoading && (
            <div className="mt-4">
              <Progress value={33} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">Agents are scanning sources and classifying findings...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {competitors.length === 0 && findings.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <HiOutlineGlobeAlt className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Get Started</h3>
            <p className="text-sm text-muted-foreground mb-4">Add competitors and run your first discovery to begin tracking AI-related content.</p>
            <Button variant="outline" onClick={() => onNavigate('competitors')}>
              <HiOutlinePlus className="w-4 h-4 mr-2" />
              Add Competitors
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Findings</CardTitle>
              {findings.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => onNavigate('findings')} className="text-xs">
                  View All <HiOutlineChevronRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {findings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No findings yet. Run a discovery scan to get started.</p>
            ) : (
              <div className="space-y-3">
                {findings.slice(0, 8).map((f) => (
                  <div key={f.id} className={cn('flex items-start gap-3 p-3 rounded-lg border bg-background/50 transition-all hover:shadow-sm', (f.status ?? '').toLowerCase().includes('flagged') ? 'border-l-4 border-l-amber-400' : '')}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{f.competitor_name ?? 'Unknown'}</Badge>
                        <Badge variant="secondary" className="text-xs">{f.site_type ?? 'Unknown'}</Badge>
                        <FindingStatusBadge status={f.status ?? ''} />
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{f.title ?? 'Untitled'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(f.published_date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AgentInfoSection activeAgentId={activeAgentId} />
    </div>
  )
}

// ============================
// SCREEN: Competitor Management
// ============================
function CompetitorScreen({
  competitors,
  onAdd,
  onEdit,
  onDelete,
}: {
  competitors: Competitor[]
  onAdd: (name: string) => void
  onEdit: (id: string, name: string) => void
  onDelete: (id: string) => void
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState('')
  const [editName, setEditName] = useState('')
  const [deleteId, setDeleteId] = useState('')
  const [deleteName, setDeleteName] = useState('')

  const handleAdd = () => {
    if (newName.trim()) {
      onAdd(newName.trim())
      setNewName('')
      setAddOpen(false)
    }
  }

  const handleEdit = () => {
    if (editName.trim() && editId) {
      onEdit(editId, editName.trim())
      setEditOpen(false)
    }
  }

  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId)
      setDeleteOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Competitor Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage the companies you are tracking for competitive intelligence</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <HiOutlinePlus className="w-4 h-4 mr-2" />
          Add Competitor
        </Button>
      </div>

      {competitors.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <HiOutlineUserGroup className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Competitors Added Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Add your first competitor to begin tracking their AI-related activities and content.</p>
            <Button onClick={() => setAddOpen(true)}>
              <HiOutlinePlus className="w-4 h-4 mr-2" />
              Add Your First Competitor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Competitor Name</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitors.map((c, idx) => (
                <TableRow key={c.id}>
                  <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(c.dateAdded)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditId(c.id); setEditName(c.name); setEditOpen(true) }}
                      >
                        <HiOutlinePencilSquare className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => { setDeleteId(c.id); setDeleteName(c.name); setDeleteOpen(true) }}
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Competitor</DialogTitle>
            <DialogDescription>Enter the name of the competitor you want to track.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="comp-name">Competitor Name</Label>
              <Input
                id="comp-name"
                placeholder="e.g. OpenAI, Google DeepMind"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!newName.trim()}>Add Competitor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Competitor</DialogTitle>
            <DialogDescription>Update the competitor name.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="edit-name">Competitor Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={!editName.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Competitor</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{deleteName}</strong> from your tracked competitors? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================
// SCREEN: Findings Review
// ============================
function FindingsScreen({
  findings,
  onUpdateStatus,
  discoveryXlsxUrl,
}: {
  findings: Finding[]
  onUpdateStatus: (id: string, status: string) => void
  discoveryXlsxUrl: string
}) {
  const [filterCompetitor, setFilterCompetitor] = useState('all')
  const [filterSiteType, setFilterSiteType] = useState('all')
  const [filterEngagement, setFilterEngagement] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const competitors = Array.from(new Set(findings.map((f) => f.competitor_name).filter(Boolean)))
  const siteTypes = Array.from(new Set(findings.map((f) => f.site_type).filter(Boolean)))
  const engagementTypes = Array.from(new Set(findings.map((f) => f.engagement_type).filter(Boolean)))

  const filtered = findings.filter((f) => {
    if (filterCompetitor !== 'all' && f.competitor_name !== filterCompetitor) return false
    if (filterSiteType !== 'all' && f.site_type !== filterSiteType) return false
    if (filterEngagement !== 'all' && f.engagement_type !== filterEngagement) return false
    if (filterStatus !== 'all') {
      const s = (f.status ?? '').toLowerCase()
      if (filterStatus === 'approved' && !s.includes('approved')) return false
      if (filterStatus === 'flagged' && !s.includes('flagged')) return false
      if (filterStatus === 'dismissed' && !s.includes('dismiss')) return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Findings Review</h2>
          <p className="text-sm text-muted-foreground mt-1">{findings.length} total findings across all discoveries</p>
        </div>
        {discoveryXlsxUrl && (
          <Button variant="outline" asChild>
            <a href={discoveryXlsxUrl} target="_blank" rel="noopener noreferrer">
              <HiOutlineArrowDownTray className="w-4 h-4 mr-2" />
              Export XLSX
            </a>
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <HiOutlineFunnel className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filters</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={filterCompetitor} onValueChange={setFilterCompetitor}>
              <SelectTrigger><SelectValue placeholder="Competitor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Competitors</SelectItem>
                {competitors.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterSiteType} onValueChange={setFilterSiteType}>
              <SelectTrigger><SelectValue placeholder="Site Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Site Types</SelectItem>
                {siteTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterEngagement} onValueChange={setFilterEngagement}>
              <SelectTrigger><SelectValue placeholder="Engagement" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Engagement Types</SelectItem>
                {engagementTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {findings.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <HiOutlineClipboardDocumentCheck className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Findings Yet</h3>
            <p className="text-sm text-muted-foreground">Run a discovery from the Dashboard to populate findings here.</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <HiOutlineFunnel className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Matching Findings</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your filters to see more results.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <ScrollArea className="max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competitor</TableHead>
                  <TableHead className="min-w-[250px]">Title / Description</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f) => {
                  const isFlagged = (f.status ?? '').toLowerCase().includes('flagged')
                  const isDismissed = (f.status ?? '').toLowerCase().includes('dismiss')
                  return (
                    <React.Fragment key={f.id}>
                      <TableRow className={cn(isFlagged ? 'border-l-4 border-l-amber-400 bg-amber-50/30' : '', isDismissed ? 'opacity-60' : '')}>
                        <TableCell>
                          <Badge variant="outline" className="text-xs whitespace-nowrap">{f.competitor_name ?? 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>
                          <button onClick={() => setExpandedId(expandedId === f.id ? null : f.id)} className="text-left">
                            <p className="text-sm font-medium text-foreground leading-snug">{f.title ?? 'Untitled'}</p>
                            {f.url && (
                              <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-0.5 inline-block" onClick={(e) => e.stopPropagation()}>
                                {f.source_name || 'View source'}
                              </a>
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{f.site_type ?? 'N/A'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{f.media_type ?? 'N/A'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{f.engagement_type ?? 'N/A'}</TableCell>
                        <TableCell>
                          <span className={cn('text-xs font-semibold', (f.confidence_score ?? 0) >= 0.8 ? 'text-green-700' : (f.confidence_score ?? 0) >= 0.6 ? 'text-amber-700' : 'text-red-700')}>
                            {typeof f.confidence_score === 'number' ? `${Math.round(f.confidence_score * 100)}%` : 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell><FindingStatusBadge status={f.status ?? ''} /></TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(f.published_date)}</TableCell>
                        <TableCell className="text-right">
                          {isFlagged && (
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" className="text-green-700 hover:text-green-800 h-7 px-2" onClick={() => onUpdateStatus(f.id, 'Auto-Approved')}>
                                <HiOutlineCheckCircle className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 h-7 px-2" onClick={() => onUpdateStatus(f.id, 'Dismissed')}>
                                <HiOutlineXCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                      {expandedId === f.id && (
                        <TableRow>
                          <TableCell colSpan={9} className="bg-secondary/30 p-4">
                            <div className="space-y-2">
                              {f.description && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Description</p>
                                  <p className="text-sm text-foreground">{f.description}</p>
                                </div>
                              )}
                              {f.content_snippet && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Content Snippet</p>
                                  <p className="text-sm text-foreground italic">&ldquo;{f.content_snippet}&rdquo;</p>
                                </div>
                              )}
                              {f.flag_reason && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Flag Reason</p>
                                  <p className="text-sm text-amber-700">{f.flag_reason}</p>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      )}
    </div>
  )
}

// ============================
// SCREEN: Reports
// ============================
function ReportsScreen({
  reports,
  findings,
  onGenerateReport,
  reportLoading,
  activeAgentId,
}: {
  reports: StoredReport[]
  findings: Finding[]
  onGenerateReport: (month: string, year: string) => void
  reportLoading: boolean
  activeAgentId: string | null
}) {
  const [selectedMonth, setSelectedMonth] = useState('February')
  const [selectedYear, setSelectedYear] = useState('2025')
  const [viewingReport, setViewingReport] = useState<StoredReport | null>(null)

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const years = ['2024', '2025', '2026']

  const approvedCount = findings.filter((f) => (f.status ?? '').toLowerCase().includes('approved')).length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Reports</h2>
        <p className="text-sm text-muted-foreground mt-1">Generate and view monthly competitive intelligence reports</p>
      </div>

      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Generate Monthly Report</h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex gap-3">
              <div>
                <Label className="text-xs mb-1.5 block">Month</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {months.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-xs text-muted-foreground">
                {approvedCount} approved finding{approvedCount === 1 ? '' : 's'} available
              </p>
              <Button
                onClick={() => onGenerateReport(selectedMonth, selectedYear)}
                disabled={reportLoading || approvedCount === 0}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {reportLoading ? (
                  <>
                    <HiOutlineArrowPath className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <HiOutlineDocumentText className="w-4 h-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
          {reportLoading && (
            <div className="mt-4">
              <Progress value={50} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">Analyzing findings and generating comprehensive report...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {reports.length === 0 && !viewingReport ? (
        <Card>
          <CardContent className="p-10 text-center">
            <HiOutlineDocumentText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Reports Generated Yet</h3>
            <p className="text-sm text-muted-foreground">Select a month and year above, then generate your first monthly competitive intelligence report.</p>
          </CardContent>
        </Card>
      ) : viewingReport ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setViewingReport(null)}>
              Back to Reports
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <span className="text-sm text-muted-foreground">{viewingReport.month} {viewingReport.year} Report</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricTile icon={<HiOutlineMagnifyingGlass className="w-5 h-5" />} label="Findings Analyzed" value={viewingReport.totalFindings ?? 0} />
            <MetricTile icon={<HiOutlineUserGroup className="w-5 h-5" />} label="Competitors Covered" value={viewingReport.totalCompetitors ?? 0} />
            <MetricTile icon={<HiOutlineClock className="w-5 h-5" />} label="Generated" value={formatDate(viewingReport.generatedDate)} />
          </div>

          <Tabs defaultValue="summary" className="w-full">
            <TabsList>
              <TabsTrigger value="summary">Executive Summary</TabsTrigger>
              <TabsTrigger value="landscape">Landscape</TabsTrigger>
              <TabsTrigger value="competitors">Competitors</TabsTrigger>
              <TabsTrigger value="trends">Trends & Recs</TabsTrigger>
            </TabsList>
            <TabsContent value="summary" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Executive Summary</h3>
                  {renderMarkdown(viewingReport.executiveSummary ?? '')}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="landscape" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Landscape Overview</h3>
                  {renderMarkdown(viewingReport.landscapeOverview ?? '')}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="competitors" className="mt-4">
              <div className="space-y-4">
                {Array.isArray(viewingReport.competitorAnalyses) && viewingReport.competitorAnalyses.length > 0 ? (
                  viewingReport.competitorAnalyses.map((ca, idx) => (
                    <Card key={idx}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{ca?.competitor_name ?? 'Unknown Competitor'}</CardTitle>
                          <Badge variant="outline">{ca?.total_findings ?? 0} findings</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {ca?.activity_summary && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Activity Summary</p>
                            <p className="text-sm text-foreground">{ca.activity_summary}</p>
                          </div>
                        )}
                        {ca?.key_developments && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Key Developments</p>
                            {renderMarkdown(ca.key_developments)}
                          </div>
                        )}
                        {ca?.source_distribution && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Source Distribution</p>
                            <p className="text-sm text-muted-foreground">{ca.source_distribution}</p>
                          </div>
                        )}
                        {ca?.engagement_distribution && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Engagement Distribution</p>
                            <p className="text-sm text-muted-foreground">{ca.engagement_distribution}</p>
                          </div>
                        )}
                        {ca?.notable_excerpts && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Notable Excerpts</p>
                            <p className="text-sm text-foreground italic">&ldquo;{ca.notable_excerpts}&rdquo;</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center text-sm text-muted-foreground">
                      No competitor analyses available for this report.
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            <TabsContent value="trends" className="mt-4">
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-3">Trend Analysis</h3>
                    {renderMarkdown(viewingReport.trendAnalysis ?? '')}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-3">Recommendations</h3>
                    {renderMarkdown(viewingReport.recommendations ?? '')}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">Previous Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((r) => (
              <Card key={r.id} className="hover:shadow-md transition-all duration-200 cursor-pointer" onClick={() => setViewingReport(r)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-base font-semibold text-foreground">{r.month} {r.year}</h4>
                      <p className="text-xs text-muted-foreground">Generated: {formatDate(r.generatedDate)}</p>
                    </div>
                    <HiOutlineDocumentText className="w-8 h-8 text-primary/40" />
                  </div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{r.totalFindings ?? 0}</span> findings
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{r.totalCompetitors ?? 0}</span> competitors
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{r.summary || r.executiveSummary || 'View report details'}</p>
                  <div className="flex items-center justify-between mt-4">
                    <Button variant="ghost" size="sm" className="text-xs" onClick={(e) => { e.stopPropagation(); setViewingReport(r) }}>
                      <HiOutlineEye className="w-3 h-3 mr-1" />
                      View Report
                    </Button>
                    {r.pdfUrl && (
                      <Button variant="outline" size="sm" className="text-xs" asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <HiOutlineDocumentArrowDown className="w-3 h-3 mr-1" />
                          PDF
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <AgentInfoSection activeAgentId={activeAgentId} />
    </div>
  )
}

// ============================
// MAIN PAGE
// ============================
export default function Page() {
  // Navigation
  const [activeScreen, setActiveScreen] = useState<ScreenName>('dashboard')

  // Data state
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [findings, setFindings] = useState<Finding[]>([])
  const [reports, setReports] = useState<StoredReport[]>([])
  const [discoveryHistory, setDiscoveryHistory] = useState<DiscoveryRun[]>([])

  // UI state
  const [sampleMode, setSampleMode] = useState(false)
  const [discoveryLoading, setDiscoveryLoading] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null)
  const [latestXlsxUrl, setLatestXlsxUrl] = useState('')

  // Load from localStorage on mount
  useEffect(() => {
    setCompetitors(lsGet<Competitor[]>(LS_COMPETITORS, []))
    setFindings(lsGet<Finding[]>(LS_FINDINGS, []))
    setReports(lsGet<StoredReport[]>(LS_REPORTS, []))
    setDiscoveryHistory(lsGet<DiscoveryRun[]>(LS_DISCOVERY_HISTORY, []))
  }, [])

  // Persist to localStorage when data changes
  useEffect(() => {
    lsSet(LS_COMPETITORS, competitors)
  }, [competitors])
  useEffect(() => {
    lsSet(LS_FINDINGS, findings)
  }, [findings])
  useEffect(() => {
    lsSet(LS_REPORTS, reports)
  }, [reports])
  useEffect(() => {
    lsSet(LS_DISCOVERY_HISTORY, discoveryHistory)
  }, [discoveryHistory])

  // Get displayed data based on sample mode
  const displayedCompetitors = sampleMode && competitors.length === 0 ? SAMPLE_COMPETITORS : competitors
  const displayedFindings = sampleMode && findings.length === 0 ? SAMPLE_FINDINGS : findings
  const displayedReports = sampleMode && reports.length === 0 ? SAMPLE_REPORTS : reports
  const displayedHistory = sampleMode && discoveryHistory.length === 0 ? SAMPLE_DISCOVERY_HISTORY : discoveryHistory

  // --- Competitor CRUD ---
  const addCompetitor = useCallback((name: string) => {
    const newComp: Competitor = { id: generateId(), name, dateAdded: new Date().toISOString().split('T')[0] }
    setCompetitors((prev) => [...prev, newComp])
    setStatusMessage({ message: `${name} added to tracked competitors.`, type: 'success' })
  }, [])

  const editCompetitor = useCallback((id: string, name: string) => {
    setCompetitors((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)))
    setStatusMessage({ message: `Competitor updated to "${name}".`, type: 'success' })
  }, [])

  const deleteCompetitor = useCallback((id: string) => {
    setCompetitors((prev) => prev.filter((c) => c.id !== id))
    setStatusMessage({ message: 'Competitor removed.', type: 'info' })
  }, [])

  // --- Finding Status Update ---
  const updateFindingStatus = useCallback((id: string, status: string) => {
    setFindings((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)))
    setStatusMessage({ message: `Finding ${status === 'Auto-Approved' ? 'approved' : 'dismissed'}.`, type: 'success' })
  }, [])

  // --- Run Discovery ---
  const runDiscovery = useCallback(async () => {
    const comps = competitors.length > 0 ? competitors : (sampleMode ? SAMPLE_COMPETITORS : [])
    if (comps.length === 0) {
      setStatusMessage({ message: 'Add at least one competitor before running discovery.', type: 'warning' })
      return
    }

    setDiscoveryLoading(true)
    setActiveAgentId(DISCOVERY_AGENT_ID)
    setStatusMessage({ message: 'Discovery scan initiated. AI agents are scanning sources...', type: 'info' })

    try {
      const competitorNames = comps.map((c) => c.name).join(', ')
      const message = `Discover AI-related content for competitors: ${competitorNames}. Search across web, media, social, and conference sources. Classify each finding with confidence scores.`

      const result = await callAIAgent(message, DISCOVERY_AGENT_ID)

      if (result.success) {
        let data = safeJsonParse(result?.response?.result) as Record<string, unknown>
        if (!data || typeof data !== 'object') {
          data = {}
        }

        const classifiedFindings = Array.isArray(data?.classified_findings) ? data.classified_findings : []
        const batchDate = new Date().toISOString()

        const newFindings: Finding[] = classifiedFindings.map((cf: Record<string, unknown>) => ({
          id: generateId(),
          competitor_name: String(cf?.competitor_name ?? ''),
          title: String(cf?.title ?? ''),
          description: String(cf?.description ?? ''),
          url: String(cf?.url ?? ''),
          source_name: String(cf?.source_name ?? ''),
          site_type: String(cf?.site_type ?? ''),
          engagement_type: String(cf?.engagement_type ?? ''),
          media_type: String(cf?.media_type ?? ''),
          confidence_score: typeof cf?.confidence_score === 'number' ? cf.confidence_score : 0,
          status: String(cf?.status ?? 'Flagged'),
          flag_reason: String(cf?.flag_reason ?? ''),
          published_date: String(cf?.published_date ?? ''),
          content_snippet: String(cf?.content_snippet ?? ''),
          batchDate,
        }))

        setFindings((prev) => [...newFindings, ...prev])

        // Extract file URL
        const files = Array.isArray(result?.module_outputs?.artifact_files) ? result.module_outputs.artifact_files : []
        const xlsxUrl = files.length > 0 ? (files[0]?.file_url ?? '') : ''
        setLatestXlsxUrl(xlsxUrl)

        // Weekly batch info
        const wb = data?.weekly_batch as Record<string, unknown> | undefined
        const autoApproved = typeof wb?.auto_approved_count === 'number' ? wb.auto_approved_count : newFindings.filter((f) => f.status.toLowerCase().includes('approved')).length
        const flaggedCount = typeof wb?.flagged_count === 'number' ? wb.flagged_count : newFindings.filter((f) => f.status.toLowerCase().includes('flagged')).length

        const newRun: DiscoveryRun = {
          id: generateId(),
          date: batchDate,
          totalFindings: newFindings.length,
          autoApproved,
          flagged: flaggedCount,
          xlsxUrl,
        }
        setDiscoveryHistory((prev) => [newRun, ...prev])

        setStatusMessage({
          message: `Discovery complete! Found ${newFindings.length} items (${autoApproved} auto-approved, ${flaggedCount} flagged for review).`,
          type: 'success',
        })
      } else {
        setStatusMessage({
          message: `Discovery failed: ${result?.error ?? 'Unknown error'}`,
          type: 'error',
        })
      }
    } catch (err) {
      setStatusMessage({
        message: `Discovery error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        type: 'error',
      })
    } finally {
      setDiscoveryLoading(false)
      setActiveAgentId(null)
    }
  }, [competitors, sampleMode])

  // --- Generate Report ---
  const generateReport = useCallback(async (month: string, year: string) => {
    const allFindings = findings.length > 0 ? findings : (sampleMode ? SAMPLE_FINDINGS : [])
    const approvedFindings = allFindings.filter((f) => (f.status ?? '').toLowerCase().includes('approved'))

    if (approvedFindings.length === 0) {
      setStatusMessage({ message: 'No approved findings available. Run a discovery and approve findings first.', type: 'warning' })
      return
    }

    setReportLoading(true)
    setActiveAgentId(REPORT_AGENT_ID)
    setStatusMessage({ message: 'Generating monthly report. This may take a few minutes...', type: 'info' })

    try {
      const findingsSummary = approvedFindings.slice(0, 50).map((f) => ({
        competitor: f.competitor_name,
        title: f.title,
        source: f.source_name,
        type: f.site_type,
        engagement: f.engagement_type,
        score: f.confidence_score,
        date: f.published_date,
        snippet: f.content_snippet,
      }))

      const message = `Generate a monthly competitive intelligence report for ${month} ${year}. Analyze these approved findings: ${JSON.stringify(findingsSummary)}. Provide executive summary, trend analysis, and per-competitor overviews.`

      const result = await callAIAgent(message, REPORT_AGENT_ID)

      if (result.success) {
        let data = safeJsonParse(result?.response?.result) as Record<string, unknown>
        if (!data || typeof data !== 'object') {
          data = {}
        }

        const report = (data?.report ?? data) as Record<string, unknown>
        const competitorAnalyses = Array.isArray(report?.competitor_analyses) ? report.competitor_analyses : []

        const files = Array.isArray(result?.module_outputs?.artifact_files) ? result.module_outputs.artifact_files : []
        const pdfUrl = files.length > 0 ? (files[0]?.file_url ?? '') : ''

        const newReport: StoredReport = {
          id: generateId(),
          month: String(report?.month ?? month),
          year: String(report?.year ?? year),
          generatedDate: new Date().toISOString(),
          totalFindings: typeof report?.total_findings_analyzed === 'number' ? report.total_findings_analyzed : approvedFindings.length,
          totalCompetitors: typeof report?.total_competitors === 'number' ? report.total_competitors : new Set(approvedFindings.map((f) => f.competitor_name)).size,
          executiveSummary: String(report?.executive_summary ?? ''),
          landscapeOverview: String(report?.landscape_overview ?? ''),
          trendAnalysis: String(report?.trend_analysis ?? ''),
          recommendations: String(report?.recommendations ?? ''),
          competitorAnalyses: competitorAnalyses.map((ca: Record<string, unknown>) => ({
            competitor_name: String(ca?.competitor_name ?? ''),
            total_findings: typeof ca?.total_findings === 'number' ? ca.total_findings : 0,
            activity_summary: String(ca?.activity_summary ?? ''),
            key_developments: String(ca?.key_developments ?? ''),
            source_distribution: String(ca?.source_distribution ?? ''),
            engagement_distribution: String(ca?.engagement_distribution ?? ''),
            notable_excerpts: String(ca?.notable_excerpts ?? ''),
          })),
          pdfUrl,
          summary: String(data?.summary ?? ''),
        }

        setReports((prev) => [newReport, ...prev])
        setStatusMessage({
          message: `Report for ${month} ${year} generated successfully!`,
          type: 'success',
        })
      } else {
        setStatusMessage({
          message: `Report generation failed: ${result?.error ?? 'Unknown error'}`,
          type: 'error',
        })
      }
    } catch (err) {
      setStatusMessage({
        message: `Report error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        type: 'error',
      })
    } finally {
      setReportLoading(false)
      setActiveAgentId(null)
    }
  }, [findings, sampleMode])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex">
        {/* Sidebar */}
        <SidebarNav activeScreen={activeScreen} onNavigate={setActiveScreen} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          {/* Header */}
          <header className="h-16 border-b border-border/40 bg-card flex items-center justify-between px-6 flex-shrink-0">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-foreground tracking-wide">AI Competitor Intelligence Hub</h1>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground cursor-pointer">
                Sample Data
              </Label>
              <Switch
                id="sample-toggle"
                checked={sampleMode}
                onCheckedChange={setSampleMode}
              />
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-6">
            {/* Status Banner */}
            {statusMessage && (
              <StatusBanner
                message={statusMessage.message}
                type={statusMessage.type}
                onDismiss={() => setStatusMessage(null)}
              />
            )}

            {/* Screen Rendering */}
            {activeScreen === 'dashboard' && (
              <DashboardScreen
                competitors={displayedCompetitors}
                findings={displayedFindings}
                reports={displayedReports}
                discoveryHistory={displayedHistory}
                onRunDiscovery={runDiscovery}
                discoveryLoading={discoveryLoading}
                activeAgentId={activeAgentId}
                onNavigate={setActiveScreen}
              />
            )}

            {activeScreen === 'competitors' && (
              <CompetitorScreen
                competitors={displayedCompetitors}
                onAdd={addCompetitor}
                onEdit={editCompetitor}
                onDelete={deleteCompetitor}
              />
            )}

            {activeScreen === 'findings' && (
              <FindingsScreen
                findings={displayedFindings}
                onUpdateStatus={updateFindingStatus}
                discoveryXlsxUrl={latestXlsxUrl}
              />
            )}

            {activeScreen === 'reports' && (
              <ReportsScreen
                reports={displayedReports}
                findings={displayedFindings}
                onGenerateReport={generateReport}
                reportLoading={reportLoading}
                activeAgentId={activeAgentId}
              />
            )}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}
