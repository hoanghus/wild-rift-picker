"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import championsData from "@/data/champions.json"
import tiersData from "@/data/tiers.json"
import countersData from "@/data/counters.json"
import synergiesData from "@/data/synergies.json"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Swords, Users, Zap, ArrowUpDown, X, Shield, ChevronRight, ExternalLink } from "lucide-react"

type Champion = { id: string | number; name: string; slug: string; icon: string; tier: string; lanes: string[]; roles: string[]; win_rate?: number }
type TierInfo = { overall: string; by_role: Record<string, string>; win_rate?: number }
type CounterInfo = { strong_against: string[]; weak_against: string[] }
type SynergyInfo = { with: string; description: string; type: string }
type ViewMode = "tierlist" | "counter" | "synergy" | "draft"

const LANES = ["baron", "jungle", "mid", "adc", "support"] as const
const LANE_CONFIG: Record<string, { label: string; icon: string }> = {
  baron: { label: "Baron", icon: "🛡️" },
  jungle: { label: "Jungle", icon: "🌿" },
  mid: { label: "Mid", icon: "⚡" },
  adc: { label: "ADC", icon: "🎯" },
  support: { label: "Supp", icon: "💎" },
}
const TIER_LABELS = ["S+", "S", "A", "B", "C"] as const
const TIER_COLORS: Record<string, string> = { "S+": "border-tier-s\\+", "S": "border-tier-s", "A": "border-tier-a", "B": "border-tier-b", "C": "border-tier-c" }
const TIER_TEXT: Record<string, string> = { "S+": "text-red-400", "S": "text-orange-400", "A": "text-green-400", "B": "text-blue-400", "C": "text-gray-500" }

const champions = championsData as Champion[]
const tiers = tiersData as { patch: string; champions: Record<string, TierInfo> }
const counters = countersData as Record<string, CounterInfo>
const synergies = synergiesData as Record<string, { synergies: SynergyInfo[] }>

function ChampionCard({ champion, size = 64, showName = true, selected = false, onClick }: { champion: Champion; size?: number; showName?: boolean; selected?: boolean; onClick?: () => void }) {
  const tierInfo = tiers.champions[champion.slug]
  const tier = tierInfo?.overall || "B"
  const borderClass = TIER_COLORS[tier] || "border-tier-b"
  const imgSrc = `/champions/${champion.slug}.webp`

  return (
    <div className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-150 ${selected ? 'scale-110' : 'hover:scale-105'}`} onClick={onClick}>
      <div
        className={`rounded-lg overflow-hidden border-2 relative ${borderClass} ${selected ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-[#0a0a0f]' : ''}`}
        style={{ width: size, height: size }}
      >
        <img
          src={imgSrc}
          alt={champion.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://cdn.communitydragon.org/latest/champion/${champion.slug}/tile.jpg`
          }}
        />
        <div className="absolute top-0 right-0 bg-black/70 px-1 text-[9px] font-bold leading-tight" style={{ color: TIER_TEXT[tier]?.replace("text-", "") || '#999' }}>
          {tier}
        </div>
      </div>
      {showName && <span className="text-[10px] text-[#a09b8c] text-center leading-tight truncate max-w-[68px]">{champion.name}</span>}
    </div>
  )
}

function LaneButton({ lane, active, onClick }: { lane: string; active: boolean; onClick: () => void }) {
  const cfg = LANE_CONFIG[lane]
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
        active
          ? 'bg-[#c8aa6e]/20 border-[#c8aa6e] text-[#f0e6d2] shadow-[0_0_8px_rgba(200,170,110,0.15)]'
          : 'bg-[#1a1a2e] border-[#2a2a3e] text-[#7a7568] hover:border-[#c8aa6e]/50 hover:text-[#a09b8c]'
      }`}
    >
      {cfg.icon} {cfg.label}
    </button>
  )
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLane, setSelectedLane] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("tierlist")
  const searchRef = useRef<HTMLInputElement>(null)

  // Counter pick state
  const [enemyChampion, setEnemyChampion] = useState<string | null>(null)
  const [enemyLane, setEnemyLane] = useState<string>("all")

  // Synergy state
  const [teamPicks, setTeamPicks] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("tierlist")

  // Draft state
  const [myRole, setMyRole] = useState("mid")
  const [allyPicks, setAllyPicks] = useState<string[]>([])
  const [enemyPicks, setEnemyPicks] = useState<string[]>([])

  // Auto-focus search
  useEffect(() => { searchRef.current?.focus() }, [viewMode])

  const getChampion = (slug: string): Champion | undefined => champions.find(c => c.slug === slug)

  const filteredChampions = useMemo(() => {
    return champions.filter(c => {
      if (selectedLane && !c.lanes.includes(selectedLane)) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim()
        if (!c.name.toLowerCase().includes(q) && !c.slug.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [selectedLane, searchQuery])

  const getTier = (slug: string): string => {
    const info = tiers.champions[slug]
    if (!info) return "B"
    if (selectedLane && info.by_role[selectedLane]) return info.by_role[selectedLane]
    return info.overall || "B"
  }

  const sortedByTier = useMemo(() => {
    const order = ["S+", "S", "A", "B", "C"]
    return [...filteredChampions].sort((a, b) => {
      const tA = order.indexOf(getTier(a.slug))
      const tB = order.indexOf(getTier(b.slug))
      return tA - tB
    })
  }, [filteredChampions])

  const getCounters = (slug: string): { strong: Champion[]; weak: Champion[] } => {
    const c = counters[slug]
    if (!c) return { strong: [], weak: [] }
    return {
      strong: c.strong_against.map(s => getChampion(s)).filter(Boolean) as Champion[],
      weak: c.weak_against.map(s => getChampion(s)).filter(Boolean) as Champion[]
    }
  }

  const getSynergies = (slugs: string[]): { champion: Champion; score: number; reasons: string[] }[] => {
    const scores: Record<string, { champion: Champion; score: number; reasons: string[] }> = {}
    for (let i = 0; i < slugs.length; i++) {
      for (let j = i + 1; j < slugs.length; j++) {
        const s1 = slugs[i], s2 = slugs[j]
        const match = (synergies[s1]?.synergies || []).find(s => s.with === s2)
        if (match) {
          const c1 = getChampion(s1); const c2 = getChampion(s2)
          if (c1 && !scores[s1]) scores[s1] = { champion: c1, score: 0, reasons: [] }
          if (c2 && !scores[s2]) scores[s2] = { champion: c2, score: 0, reasons: [] }
          if (scores[s1]) { scores[s1].score += 3; scores[s1].reasons.push(match.description) }
          if (scores[s2]) { scores[s2].score += 3; scores[s2].reasons.push(match.description) }
        }
      }
    }
    const results: { champion: Champion; score: number; reasons: string[] }[] = []
    for (const c of champions) {
      if (slugs.includes(c.slug)) continue
      let score = 0; const reasons: string[] = []
      const tierInfo = tiers.champions[c.slug]
      if (tierInfo) {
        if (tierInfo.overall === "S+") { score += 5; reasons.push("S+ tier") }
        else if (tierInfo.overall === "S") { score += 3 }
      }
      for (const slug of slugs) {
        const syn = synergies[c.slug]?.synergies || []
        const m = syn.find(s => s.with === slug)
        if (m) { score += 3; reasons.push(m.description.split(" — ")[0].slice(0, 40)) }
      }
      results.push({ champion: c, score, reasons })
    }
    return results.sort((a, b) => b.score - a.score).slice(0, 8)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0e6d2]">
      {/* Header - LoL style */}
      <header className="border-b border-[#c8aa6e]/20 bg-gradient-to-b from-[#0f0f1a] to-[#0a0a0f] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#c8aa6e] to-[#8a6d2b] flex items-center justify-center text-sm font-bold text-[#010101] shadow-[0_0_12px_rgba(200,170,110,0.3)]">
              WR
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>WILD RIFT PICKER</h1>
              <p className="text-[10px] text-[#7a7568] tracking-wider">PATCH {tiers.patch} · {champions.length} CHAMPIONS</p>
            </div>
          </div>

          {/* Search - typeahead */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c8aa6e]/60" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Tìm tướng..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg pl-10 pr-8 py-2 text-sm text-[#f0e6d2] placeholder:text-[#7a7568] focus:outline-none focus:border-[#c8aa6e]/50 focus:shadow-[0_0_8px_rgba(200,170,110,0.1)] transition-all"
            />
            {searchQuery && (
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a7568] hover:text-[#f0e6d2]" onClick={() => setSearchQuery("")}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Lane selector - buttons! */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedLane(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border shrink-0 ${
              !selectedLane
                ? 'bg-[#c8aa6e]/20 border-[#c8aa6e] text-[#f0e6d2]'
                : 'bg-[#1a1a2e] border-[#2a2a3e] text-[#7a7568] hover:border-[#c8aa6e]/50'
            }`}
          >
            All
          </button>
          {LANES.map(lane => (
            <LaneButton key={lane} lane={lane} active={selectedLane === lane} onClick={() => setSelectedLane(selectedLane === lane ? null : lane)} />
          ))}
          <div className="flex-1" />
          <div className="hidden sm:flex items-center gap-1">
            {(["S+","S","A","B","C"] as const).map(t => (
              <span key={t} className={`text-[10px] font-bold px-1.5 ${TIER_TEXT[t]}`}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Champion grid */}
      <div className="max-w-7xl mx-auto px-4 pb-3">
        <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16 xl:grid-cols-18 gap-1.5">
          {sortedByTier.map(c => (
            <ChampionCard
              key={c.slug}
              champion={c}
              size={54}
              onClick={() => {
                setEnemyChampion(c.slug)
                setViewMode("counter")
                setActiveTab("counter")
              }}
            />
          ))}
          {sortedByTier.length === 0 && (
            <div className="col-span-full text-center py-12 text-[#7a7568] text-sm">
              Không tìm thấy tướng nào
            </div>
          )}
        </div>
        {sortedByTier.length > 0 && (
          <p className="text-[10px] text-[#7a7568] mt-2 text-center">
            {sortedByTier.length} tướng · click để xem counter
          </p>
        )}
      </div>

      {/* Action tabs */}
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <div className="flex gap-1 bg-[#1a1a2e] rounded-lg p-1 border border-[#2a2a3e] mb-4 overflow-x-auto">
          {([
            { id: "tierlist", label: "Tier List", icon: ArrowUpDown },
            { id: "counter", label: "Counter Pick", icon: Swords },
            { id: "synergy", label: "Synergy", icon: Users },
            { id: "draft", label: "Draft", icon: Zap },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setViewMode(tab.id as ViewMode) }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#c8aa6e]/15 text-[#c8aa6e] shadow-sm'
                  : 'text-[#7a7568] hover:text-[#a09b8c]'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* TIER LIST */}
        {activeTab === "tierlist" && (
          <div className="space-y-3">
            {(["S+","S","A","B","C"] as const).map(tier => {
              const champs = sortedByTier.filter(c => getTier(c.slug) === tier)
              if (champs.length === 0) return null
              return (
                <div key={tier}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-sm font-bold ${TIER_TEXT[tier]}`}>{tier}</span>
                    <span className="text-[10px] text-[#7a7568]">({champs.length})</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-[#2a2a3e] to-transparent" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {champs.map(c => (
                      <ChampionCard key={c.slug} champion={c} size={48} onClick={() => { setEnemyChampion(c.slug); setActiveTab("counter") }} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* COUNTER PICK */}
        {activeTab === "counter" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Champion selector */}
            <Card className="bg-[#1a1a2e] border-[#2a2a3e]">
              <CardContent className="p-3 space-y-2">
                <h3 className="text-xs font-bold text-[#c8aa6e] tracking-wider">CHỌN TƯỚNG ĐỊCH</h3>
                <div className="flex gap-1">
                  {LANES.map(l => (
                    <button key={l}
                      onClick={() => setEnemyLane(enemyLane === l ? "all" : l)}
                      className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                        enemyLane === l ? 'bg-[#c8aa6e]/20 text-[#c8aa6e]' : 'bg-[#0a0a0f] text-[#7a7568]'
                      }`}
                    >
                      {LANE_CONFIG[l].icon}
                    </button>
                  ))}
                </div>
                <ScrollArea className="h-48">
                  <div className="flex flex-wrap gap-1.5">
                    {champions.filter(c => enemyLane === "all" || c.lanes.includes(enemyLane)).map(c => (
                      <ChampionCard key={c.slug} champion={c} size={40} showName={false}
                        selected={enemyChampion === c.slug}
                        onClick={() => setEnemyChampion(c.slug)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Counter results */}
            <Card className="bg-[#1a1a2e] border-[#2a2a3e] lg:col-span-2">
              <CardContent className="p-3">
                {!enemyChampion ? (
                  <div className="text-center py-8 text-[#7a7568] text-xs">Click vào tướng địch để xem counter</div>
                ) : (() => {
                  const enemy = getChampion(enemyChampion)
                  const counter = getCounters(enemyChampion)
                  return (
                    <div className="space-y-3">
                      {enemy && (
                        <div className="flex items-center gap-3 p-2 bg-[#0a0a0f] rounded-lg border border-[#2a2a3e]">
                          <ChampionCard champion={enemy} size={48} showName={false} />
                          <div>
                            <p className="font-bold text-sm">{enemy.name}</p>
                            <div className="flex gap-1 mt-0.5">
                              {enemy.lanes.map(l => (
                                <Badge key={l} variant="outline" className="text-[9px] px-1 py-0 bg-[#1a1a2e] border-[#2a2a3e] text-[#7a7568]">
                                  {LANE_CONFIG[l]?.icon} {LANE_CONFIG[l]?.label}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="text-xs font-semibold text-green-400 mb-1.5 flex items-center gap-1.5">
                          <Shield className="w-3 h-3" /> NÊN CHỌN ĐỂ COUNTER
                        </h4>
                        {counter.strong.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {counter.strong.map(c => (
                              <ChampionCard key={c.slug} champion={c} size={48} />
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#7a7568]">Chưa có dữ liệu</p>
                        )}
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-red-400 mb-1.5 flex items-center gap-1.5">
                          <Swords className="w-3 h-3" /> NÊN TRÁNH
                        </h4>
                        {counter.weak.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {counter.weak.map(c => (
                              <ChampionCard key={c.slug} champion={c} size={48} />
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#7a7568]">Chưa có dữ liệu</p>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </div>
        )}

        {/* SYNERGY */}
        {activeTab === "synergy" && (
          <Card className="bg-[#1a1a2e] border-[#2a2a3e]">
            <CardContent className="p-3 space-y-3">
              <p className="text-xs text-[#7a7568]">Chọn 2-5 tướng team bạn:</p>
              <div className="flex flex-wrap gap-2 min-h-[60px] p-2 bg-[#0a0a0f] rounded-lg border border-[#2a2a3e]">
                {teamPicks.map(slug => {
                  const c = getChampion(slug)
                  return c ? (
                    <div key={slug} className="relative" onClick={() => setTeamPicks(teamPicks.filter(s => s !== slug))}>
                      <ChampionCard champion={c} size={48} showName={false} />
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500/80 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-500">
                        <span className="text-white text-[7px]">×</span>
                      </div>
                    </div>
                  ) : null
                })}
                {teamPicks.length === 0 && <p className="text-xs text-[#7a7568] p-3">Chưa chọn</p>}
              </div>
              {teamPicks.length < 5 && (
                <ScrollArea className="h-28">
                  <div className="flex flex-wrap gap-1.5">
                    {champions.filter(c => !teamPicks.includes(c.slug)).map(c => (
                      <ChampionCard key={c.slug} champion={c} size={40} showName={false}
                        onClick={() => { if (teamPicks.length < 5) setTeamPicks([...teamPicks, c.slug]) }}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
              {teamPicks.length >= 2 && (
                <>
                  <Separator className="bg-[#2a2a3e]" />
                  <div>
                    <h4 className="text-xs font-bold text-[#c8aa6e] mb-2">GỢI Ý PICK TIẾP THEO</h4>
                    <div className="space-y-1.5">
                      {getSynergies(teamPicks).filter(r => r.score > 0).slice(0, 6).map((rec, i) => (
                        <div key={i} className="flex items-center gap-2 p-1.5 bg-[#0a0a0f] rounded-lg">
                          <span className={`text-[10px] font-bold w-4 text-center ${i === 0 ? 'text-[#c8aa6e]' : 'text-[#7a7568]'}`}>
                            #{i + 1}
                          </span>
                          <ChampionCard champion={rec.champion} size={36} showName={false} />
                          <span className="text-xs text-[#a09b8c] truncate flex-1">{rec.reasons.slice(0, 1).join(", ")}</span>
                          <span className="text-[10px] font-bold text-[#c8aa6e]">+{rec.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* DRAFT ASSISTANT */}
        {activeTab === "draft" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-[#1a1a2e] border-[#2a2a3e]">
              <CardContent className="p-3 space-y-2">
                <h3 className="text-xs font-bold text-blue-400 tracking-wider">TEAM BẠN</h3>
                <div className="flex flex-wrap gap-1.5 min-h-[48px] p-2 bg-[#0a0a0f] rounded-lg border border-[#2a2a3e]">
                  {allyPicks.length === 0 && <p className="text-[10px] text-[#7a7568] p-1">Chưa chọn</p>}
                  {allyPicks.map(slug => {
                    const c = getChampion(slug)
                    return c ? <div key={slug} className="relative cursor-pointer" onClick={() => setAllyPicks(allyPicks.filter(s => s !== slug))}>
                      <ChampionCard champion={c} size={40} showName={false} />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500/80 rounded-full flex items-center justify-center cursor-pointer"><span className="text-white text-[6px]">×</span></div>
                    </div> : null
                  })}
                </div>
                <p className="text-[10px] text-[#7a7568]">Vai trò bạn:</p>
                <div className="flex gap-1">
                  {LANES.map(l => (
                    <button key={l} onClick={() => setMyRole(l)}
                      className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${myRole === l ? 'bg-[#c8aa6e]/20 text-[#c8aa6e] border border-[#c8aa6e]/50' : 'bg-[#0a0a0f] text-[#7a7568] border border-transparent'}`}>
                      {LANE_CONFIG[l].icon} {LANE_CONFIG[l].label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#1a1a2e] border-[#2a2a3e]">
              <CardContent className="p-3 space-y-2">
                <h3 className="text-xs font-bold text-red-400 tracking-wider">TEAM ĐỊCH</h3>
                <div className="flex flex-wrap gap-1.5 min-h-[48px] p-2 bg-[#0a0a0f] rounded-lg border border-[#2a2a3e]">
                  {enemyPicks.length === 0 && <p className="text-[10px] text-[#7a7568] p-1">Chưa chọn</p>}
                  {enemyPicks.map(slug => {
                    const c = getChampion(slug)
                    return c ? <div key={slug} className="relative cursor-pointer" onClick={() => setEnemyPicks(enemyPicks.filter(s => s !== slug))}>
                      <ChampionCard champion={c} size={40} showName={false} />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500/80 rounded-full flex items-center justify-center cursor-pointer"><span className="text-white text-[6px]">×</span></div>
                    </div> : null
                  })}
                </div>
              </CardContent>
            </Card>
            {/* Champion selector for draft */}
            <div className="lg:col-span-2">
              <ScrollArea className="h-24">
                <div className="flex flex-wrap gap-1.5">
                  {champions.filter(c => c.lanes.includes(myRole) && !allyPicks.includes(c.slug) && !enemyPicks.includes(c.slug)).map(c => (
                    <ChampionCard key={c.slug} champion={c} size={40} showName={false}
                      onClick={() => { if (allyPicks.length < 5) setAllyPicks([...allyPicks, c.slug]) }}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
            {/* Suggestions */}
            {(allyPicks.length > 0 || enemyPicks.length > 0) && (
              <div className="lg:col-span-2">
                <Card className="bg-[#1a1a2e] border-[#2a2a3e]">
                  <CardContent className="p-3">
                    <h4 className="text-xs font-bold text-[#c8aa6e] mb-2">✨ GỢI Ý PICK ({myRole.toUpperCase()})</h4>
                    <div className="space-y-1.5">
                      {(() => {
                        const allPicked = [...allyPicks, ...enemyPicks]
                        const available = champions.filter(c => !allPicked.includes(c.slug) && c.lanes.includes(myRole))
                        const scored = available.map(c => {
                          let score = 0; const reasons: string[] = []
                          const tierInfo = tiers.champions[c.slug]
                          if (tierInfo) {
                            const roleTier = tierInfo.by_role[myRole] || tierInfo.overall
                            if (roleTier === "S+") { score += 10; reasons.push(`S+ ${myRole}`) }
                            else if (roleTier === "S") { score += 5; reasons.push(`S ${myRole}`) }
                          }
                          const ci = counters[c.slug]
                          if (ci) { for (const es of enemyPicks) { if (ci.strong_against.includes(es)) { score += 5; const ec = getChampion(es); reasons.push(`Counter ${ec?.name || es}`) } } }
                          const syn = synergies[c.slug]?.synergies || []
                          for (const s of syn) { if (allyPicks.includes(s.with)) { score += 3; reasons.push(s.description.slice(0, 35)) } }
                          return { champion: c, score, reasons }
                        }).sort((a, b) => b.score - a.score).slice(0, 6)
                        return scored.map((rec, i) => (
                          <div key={i} className="flex items-center gap-2 p-1.5 bg-[#0a0a0f] rounded-lg">
                            <span className={`text-[10px] font-bold w-5 text-center ${i === 0 ? 'text-[#c8aa6e]' : 'text-[#7a7568]'}`}>
                              #{i + 1}
                            </span>
                            <ChampionCard champion={rec.champion} size={36} showName={false} />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-medium">{rec.champion.name}</span>
                              <p className="text-[9px] text-[#7a7568] truncate">{rec.reasons.slice(0, 2).join(" · ")}</p>
                            </div>
                            <span className="text-[10px] font-bold text-[#c8aa6e]">+{rec.score}</span>
                          </div>
                        ))
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-[#2a2a3e] mt-4">
        <div className="max-w-7xl mx-auto px-4 py-3 text-[9px] text-[#7a7568] text-center space-y-1">
          <p>Wild Rift Picker — Patch {tiers.patch} · 140 champions</p>
          <p>Dữ liệu: wildriftcore.com, wildriftcounter.com · Ảnh: CommunityDragon</p>
          <p>Sửa file <code className="bg-[#1a1a2e] px-1 rounded">data/*.json</code> để cập nhật mỗi patch</p>
          <p>
            <a href="https://github.com/hoanghus/wild-rift-picker" target="_blank" rel="noopener noreferrer"
              className="text-[#c8aa6e]/60 hover:text-[#c8aa6e] inline-flex items-center gap-1">
              GitHub <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
