"use client"

import { useState, useMemo } from "react"
import championsData from "@/data/champions.json"
import tiersData from "@/data/tiers.json"
import countersData from "@/data/counters.json"
import synergiesData from "@/data/synergies.json"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Search, Shield, Swords, Users, Zap, ArrowUpDown, ChevronRight } from "lucide-react"

type Champion = {
  id: string | number
  name: string
  slug: string
  icon: string
  tier: string
  lanes: string[]
  roles: string[]
}

type TierInfo = {
  overall: string
  by_role: Record<string, string>
}

type CounterInfo = {
  strong_against: string[]
  weak_against: string[]
}

type SynergyInfo = {
  with: string
  description: string
  type: string
}

const LANE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  baron: { label: "Baron", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: "🛡️" },
  jungle: { label: "Jungle", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: "🌿" },
  mid: { label: "Mid", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: "⚡" },
  adc: { label: "ADC", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: "🎯" },
  support: { label: "Support", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: "💎" },
}

const TIER_COLORS: Record<string, string> = {
  "S+": "text-orange-400",
  "S": "text-red-400",
  "A": "text-green-400",
  "B": "text-blue-400",
  "C": "text-gray-400",
}

const champions = championsData as Champion[]
const tiers = tiersData as { patch: string; champions: Record<string, TierInfo> }
const counters = countersData as Record<string, CounterInfo>
const synergies = synergiesData as Record<string, { synergies: SynergyInfo[] }>

function ChampionIcon({ champion, size = "md", showTier = true }: { champion: Champion; size?: string; showTier?: boolean }) {
  const sizeMap: Record<string, string> = { sm: "w-12 h-12", md: "w-16 h-16", lg: "w-20 h-20" }
  const tierInfo = tiers.champions[champion.slug]
  return (
    <div className={`relative flex flex-col items-center gap-1 group cursor-pointer`}>
      <div className={`${sizeMap[size]} rounded-xl overflow-hidden border-2 border-zinc-700/50 group-hover:border-zinc-500 transition-all duration-200 group-hover:scale-105`}>
        <img src={champion.icon} alt={champion.name} className="w-full h-full object-cover" onError={(e) => {
          (e.target as HTMLImageElement).src = `https://cdn.communitydragon.org/latest/champion/${champion.slug}/tile.jpg`
        }} />
      </div>
      {showTier && tierInfo && (
        <span className={`text-xs font-bold ${TIER_COLORS[tierInfo.overall] || "text-gray-400"}`}>
          {tierInfo.overall}
        </span>
      )}
      <span className="text-[10px] text-zinc-400 text-center leading-tight max-w-[72px] truncate">{champion.name}</span>
    </div>
  )
}

function ChampionGrid({
  champions,
  selected,
  onSelect,
  tierFilter,
  laneFilter,
  searchQuery,
  multiSelect = false
}: {
  champions: Champion[]
  selected?: string[] | string | null
  onSelect?: (slug: string) => void
  tierFilter?: string
  laneFilter?: string
  searchQuery?: string
  multiSelect?: boolean
}) {
  const filtered = useMemo(() => {
    return champions.filter(c => {
      if (laneFilter && laneFilter !== "all" && !c.lanes.includes(laneFilter)) return false
      if (tierFilter && tierFilter !== "all" && tiers.champions[c.slug]?.overall !== tierFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!c.name.toLowerCase().includes(q) && !c.slug.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [champions, laneFilter, tierFilter, searchQuery])

  const isSelected = (slug: string) => {
    if (multiSelect && Array.isArray(selected)) return selected.includes(slug)
    return selected === slug
  }

  return (
    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
      {filtered.map(c => (
        <div key={c.slug} onClick={() => onSelect?.(c.slug)}>
          <div className={`relative ${isSelected(c.slug) ? 'ring-2 ring-yellow-400 rounded-xl' : ''}`}>
            <ChampionIcon champion={c} size="sm" />
            {isSelected(c.slug) && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-black text-[8px] font-bold">✓</span>
              </div>
            )}
          </div>
        </div>
      ))}
      {filtered.length === 0 && (
        <div className="col-span-full text-center py-8 text-zinc-500">
          Không tìm thấy tướng nào
        </div>
      )}
    </div>
  )
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("tierlist")
  const [searchQuery, setSearchQuery] = useState("")
  const [laneFilter, setLaneFilter] = useState("all")
  const [tierFilter, setTierFilter] = useState("all")
  
  // Counter pick state
  const [enemyChampion, setEnemyChampion] = useState<string | null>(null)
  const [enemyLane, setEnemyLane] = useState("all")
  
  // Synergy state
  const [teamPicks, setTeamPicks] = useState<string[]>([])
  
  // Draft assistant state
  const [myRole, setMyRole] = useState("mid")
  const [allyPicks, setAllyPicks] = useState<string[]>([])
  const [enemyPicks, setEnemyPicks] = useState<string[]>([])

  const getChampion = (slug: string): Champion | undefined => champions.find(c => c.slug === slug)

  // Get counter suggestions for a champion
  const getCounters = (slug: string): { strong: Champion[]; weak: Champion[] } => {
    const c = counters[slug]
    if (!c) return { strong: [], weak: [] }
    return {
      strong: c.strong_against.map(s => getChampion(s)).filter(Boolean) as Champion[],
      weak: c.weak_against.map(s => getChampion(s)).filter(Boolean) as Champion[]
    }
  }

  // Get synergy suggestions
  const getSynergies = (slugs: string[]): { champion: Champion; score: number; reasons: string[] }[] => {
    const scores: Record<string, { champion: Champion; score: number; reasons: string[] }> = {}
    
    // Check pair synergies
    for (let i = 0; i < slugs.length; i++) {
      for (let j = i + 1; j < slugs.length; j++) {
        const s1 = slugs[i], s2 = slugs[j]
        const syn1 = synergies[s1]?.synergies || []
        const syn2 = synergies[s2]?.synergies || []
        
        const match1 = syn1.find(s => s.with === s2)
        const match2 = syn2.find(s => s.with === s1)
        
        if (match1 || match2) {
          const desc = match1?.description || match2?.description || "Synergy pair"
          if (!scores[s1]) {
            const c = getChampion(s1)
            if (c) scores[s1] = { champion: c, score: 0, reasons: [] }
          }
          if (!scores[s2]) {
            const c = getChampion(s2)
            if (c) scores[s2] = { champion: c, score: 0, reasons: [] }
          }
          if (scores[s1]) { scores[s1].score += 3; scores[s1].reasons.push(desc) }
          if (scores[s2]) { scores[s2].score += 3; scores[s2].reasons.push(desc) }
        }
      }
    }
    
    // Score champions not yet picked
    const results: { champion: Champion; score: number; reasons: string[] }[] = []
    for (const c of champions) {
      if (slugs.includes(c.slug)) continue
      
      let score = 0
      const reasons: string[] = []
      
      // Tier bonus
      const tierInfo = tiers.champions[c.slug]
      if (tierInfo) {
        if (tierInfo.overall === "S+") { score += 5; reasons.push("S+ tier pick") }
        else if (tierInfo.overall === "S") { score += 3 }
      }
      
      // Synergy with existing picks
      for (const slug of slugs) {
        const syn = synergies[c.slug]?.synergies || []
        const match = syn.find(s => s.with === slug)
        if (match) {
          score += 3
          reasons.push(match.description)
        }
      }
      
      // Counter potential - check if this champ counters any enemy picks
      results.push({ champion: c, score, reasons })
    }
    
    return results.sort((a, b) => b.score - a.score).slice(0, 10)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center text-sm font-bold">
              WR
            </div>
            <div>
              <h1 className="text-lg font-bold">Wild Rift Picker</h1>
              <p className="text-[10px] text-zinc-500">Patch {tiers.patch} — 140 champions</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400"></span>Data ready</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-zinc-900 border border-zinc-800 w-full justify-start overflow-x-auto">
            <TabsTrigger value="tierlist" className="gap-2 data-[state=active]:bg-zinc-800">
              <ArrowUpDown className="w-4 h-4" /> Tier List
            </TabsTrigger>
            <TabsTrigger value="counter" className="gap-2 data-[state=active]:bg-zinc-800">
              <Swords className="w-4 h-4" /> Counter Pick
            </TabsTrigger>
            <TabsTrigger value="synergy" className="gap-2 data-[state=active]:bg-zinc-800">
              <Users className="w-4 h-4" /> Team Synergy
            </TabsTrigger>
            <TabsTrigger value="draft" className="gap-2 data-[state=active]:bg-zinc-800">
              <Zap className="w-4 h-4" /> Draft Assistant
            </TabsTrigger>
          </TabsList>

          {/* ===== TIER LIST ===== */}
          <TabsContent value="tierlist" className="space-y-4">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Tier List — Patch {tiers.patch}</CardTitle>
                    <CardDescription>Xếp hạng tướng theo từng vai trò và sức mạnh hiện tại</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <select
                      className="bg-zinc-800 text-xs px-2 py-1 rounded border border-zinc-700"
                      value={laneFilter}
                      onChange={e => setLaneFilter(e.target.value)}
                    >
                      <option value="all">All lanes</option>
                      <option value="baron">Baron</option>
                      <option value="jungle">Jungle</option>
                      <option value="mid">Mid</option>
                      <option value="adc">ADC</option>
                      <option value="support">Support</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    placeholder="Tìm tướng..."
                    className="pl-9 bg-zinc-800 border-zinc-700"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>

                {["S+", "S", "A", "B", "C"].map(tier => {
                  const filtered = champions.filter(c => {
                    const cTier = tiers.champions[c.slug]?.overall
                    if (cTier !== tier) return false
                    if (laneFilter !== "all" && !c.lanes.includes(laneFilter)) return false
                    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
                    return true
                  })
                  if (filtered.length === 0) return null
                  return (
                    <div key={tier} className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-lg font-bold ${TIER_COLORS[tier]}`}>{tier}</span>
                        <span className="text-xs text-zinc-600">({filtered.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {filtered.map(c => (
                          <ChampionIcon key={c.slug} champion={c} size="sm" />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== COUNTER PICK ===== */}
          <TabsContent value="counter" className="space-y-4">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Swords className="w-5 h-5 text-red-400" />
                  Counter Pick
                </CardTitle>
                <CardDescription>Chọn tướng địch để xem tướng nào khắc chế và bị khắc chế</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <select
                    className="bg-zinc-800 text-sm px-3 py-2 rounded border border-zinc-700 w-40"
                    value={enemyLane}
                    onChange={e => setEnemyLane(e.target.value)}
                  >
                    <option value="all">All lanes</option>
                    <option value="baron">Baron</option>
                    <option value="jungle">Jungle</option>
                    <option value="mid">Mid</option>
                    <option value="adc">ADC</option>
                    <option value="support">Support</option>
                  </select>
                </div>

                <div>
                  <p className="text-sm text-zinc-400 mb-2">Chọn tướng địch:</p>
                  <ScrollArea className="h-40">
                    <ChampionGrid
                      champions={champions.filter(c => enemyLane === "all" || c.lanes.includes(enemyLane))}
                      selected={enemyChampion}
                      onSelect={setEnemyChampion}
                    />
                  </ScrollArea>
                </div>

                {enemyChampion && (() => {
                  const enemy = getChampion(enemyChampion)
                  const counter = getCounters(enemyChampion)
                  return (
                    <div className="space-y-4 pt-2">
                      <Separator className="bg-zinc-800" />
                      
                      {enemy && (
                        <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
                          <ChampionIcon champion={enemy} size="sm" showTier={false} />
                          <div>
                            <p className="font-bold">{enemy.name}</p>
                            <div className="flex gap-1 mt-1">
                              {enemy.lanes.map(l => (
                                <Badge key={l} variant="outline" className={`text-[10px] ${LANE_CONFIG[l]?.color || ''}`}>
                                  {LANE_CONFIG[l]?.icon} {LANE_CONFIG[l]?.label}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
                          <Shield className="w-4 h-4" /> Mạnh hơn — nên chọn để counter
                        </h4>
                        {counter.strong.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {counter.strong.map(c => (
                              <ChampionIcon key={c.slug} champion={c} size="sm" />
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-500">Chưa có dữ liệu counter cho tướng này</p>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                          <Swords className="w-4 h-4" /> Yếu hơn — nên tránh khi pick
                        </h4>
                        {counter.weak.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {counter.weak.map(c => (
                              <ChampionIcon key={c.slug} champion={c} size="sm" />
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-500">Chưa có dữ liệu counter cho tướng này</p>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== SYNERGY ===== */}
          <TabsContent value="synergy" className="space-y-4">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Team Synergy
                </CardTitle>
                <CardDescription>Chọn đội hình của bạn, xem gợi ý pick tiếp theo dựa trên synergy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-zinc-400 mb-2">Đội hình hiện tại ({teamPicks.length}/5):</p>
                  <div className="flex flex-wrap gap-2 min-h-[72px] p-2 bg-zinc-800/30 rounded-lg mb-3">
                    {teamPicks.map(slug => {
                      const c = getChampion(slug)
                      return c ? (
                        <div key={slug} className="relative" onClick={() => setTeamPicks(teamPicks.filter(s => s !== slug))}>
                          <ChampionIcon champion={c} size="sm" showTier={false} />
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center cursor-pointer">
                            <span className="text-white text-[8px]">×</span>
                          </div>
                        </div>
                      ) : null
                    })}
                    {teamPicks.length === 0 && (
                      <p className="text-xs text-zinc-500 p-4">Chưa chọn tướng nào. Click để thêm vào team.</p>
                    )}
                  </div>
                </div>

                {teamPicks.length < 5 && (
                  <div>
                    <p className="text-sm text-zinc-400 mb-2">Chọn thêm tướng cho team:</p>
                    <ScrollArea className="h-32">
                      <ChampionGrid
                        champions={champions.filter(c => !teamPicks.includes(c.slug))}
                        multiSelect
                        selected={teamPicks}
                        onSelect={(slug) => {
                          if (teamPicks.length < 5) setTeamPicks([...teamPicks, slug])
                        }}
                      />
                    </ScrollArea>
                  </div>
                )}

                {teamPicks.length >= 2 && (
                  <>
                    <Separator className="bg-zinc-800" />
                    <div>
                      <h4 className="text-sm font-semibold text-blue-400 mb-2">Gợi ý pick dựa trên synergy:</h4>
                      <div className="space-y-2">
                        {getSynergies(teamPicks).filter(r => r.score > 0).slice(0, 6).map((rec, i) => (
                          <div key={i} className="flex items-center gap-3 p-2 bg-zinc-800/50 rounded-lg">
                            <span className="text-xs text-zinc-500 w-5">#{i + 1}</span>
                            <ChampionIcon champion={rec.champion} size="sm" showTier={false} />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{rec.champion.name}</p>
                              <p className="text-xs text-zinc-400">{rec.reasons.slice(0, 2).join(", ")}</p>
                            </div>
                            <span className="text-xs font-bold text-yellow-400">+{rec.score}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== DRAFT ASSISTANT ===== */}
          <TabsContent value="draft" className="space-y-4">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Draft Assistant
                </CardTitle>
                <CardDescription>
                  Nhập tướng team bạn và team địch đã pick → xem gợi ý pick tối ưu cho lượt tiếp theo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-blue-400 mb-2">Team mình ({allyPicks.length}/5):</p>
                    <div className="flex flex-wrap gap-2 min-h-[60px] p-2 bg-zinc-800/30 rounded-lg mb-2">
                      {allyPicks.map(slug => {
                        const c = getChampion(slug)
                        return c ? (
                          <div key={slug} className="relative" onClick={() => setAllyPicks(allyPicks.filter(s => s !== slug))}>
                            <ChampionIcon champion={c} size="sm" showTier={false} />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center cursor-pointer">
                              <span className="text-white text-[6px]">×</span>
                            </div>
                          </div>
                        ) : null
                      })}
                    </div>
                    <p className="text-xs text-zinc-500 mb-1">Vai trò của bạn:</p>
                    <select
                      className="bg-zinc-800 text-xs px-2 py-1 rounded border border-zinc-700 w-full"
                      value={myRole}
                      onChange={e => setMyRole(e.target.value)}
                    >
                      <option value="baron">Baron</option>
                      <option value="jungle">Jungle</option>
                      <option value="mid">Mid</option>
                      <option value="adc">ADC</option>
                      <option value="support">Support</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-400 mb-2">Team địch ({enemyPicks.length}/5):</p>
                    <div className="flex flex-wrap gap-2 min-h-[60px] p-2 bg-zinc-800/30 rounded-lg mb-2">
                      {enemyPicks.map(slug => {
                        const c = getChampion(slug)
                        return c ? (
                          <div key={slug} className="relative" onClick={() => setEnemyPicks(enemyPicks.filter(s => s !== slug))}>
                            <ChampionIcon champion={c} size="sm" showTier={false} />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center cursor-pointer">
                              <span className="text-white text-[6px]">×</span>
                            </div>
                          </div>
                        ) : null
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <ScrollArea className="h-32 flex-1">
                    <ChampionGrid
                      champions={champions.filter(c => {
                        const current = [...allyPicks, ...enemyPicks]
                        return !current.includes(c.slug) && c.lanes.includes(myRole)
                      })}
                      selected={null}
                      onSelect={(slug) => {
                        if (allyPicks.length < 5) setAllyPicks([...allyPicks, slug])
                      }}
                    />
                  </ScrollArea>
                </div>

                {(allyPicks.length > 0 || enemyPicks.length > 0) && (
                  <>
                    <Separator className="bg-zinc-800" />
                    <div>
                      <h4 className="text-sm font-semibold text-yellow-400 mb-2">
                        ✨ Gợi ý pick cho bạn ({myRole})
                      </h4>
                      <div className="space-y-2">
                        {(() => {
                          const allPicked = [...allyPicks, ...enemyPicks]
                          const available = champions.filter(c => {
                            if (allPicked.includes(c.slug)) return false
                            return c.lanes.includes(myRole)
                          })
                          
                          // Score available champs
                          const scored = available.map(c => {
                            let score = 0
                            const reasons: string[] = []
                            
                            // Tier score
                            const tierInfo = tiers.champions[c.slug]
                            if (tierInfo) {
                              const roleTier = tierInfo.by_role[myRole] || tierInfo.overall
                              if (roleTier === "S+") { score += 10; reasons.push(`S+ ${myRole}`) }
                              else if (roleTier === "S") { score += 5; reasons.push(`S ${myRole}`) }
                              else if (roleTier === "A") { score += 2 }
                            }
                            
                            // Counter score - good against enemy picks
                            const counterInfo = counters[c.slug]
                            if (counterInfo) {
                              for (const es of enemyPicks) {
                                if (counterInfo.strong_against.includes(es)) {
                                  score += 5
                                  const eChamp = getChampion(es)
                                  reasons.push(`Counter ${eChamp?.name || es}`)
                                }
                              }
                            }
                            
                            // Synergy with ally picks
                            const syn = synergies[c.slug]?.synergies || []
                            for (const s of syn) {
                              if (allyPicks.includes(s.with)) {
                                score += 3
                                reasons.push(s.description.split(" — ")[0].slice(0, 40))
                              }
                            }
                            
                            return { champion: c, score, reasons }
                          }).sort((a, b) => b.score - a.score).slice(0, 8)
                          
                          return scored.map((rec, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 bg-zinc-800/50 rounded-lg">
                              <span className={`text-xs font-bold w-6 ${i === 0 ? 'text-yellow-400' : 'text-zinc-500'}`}>
                                #{i + 1}
                              </span>
                              <ChampionIcon champion={rec.champion} size="sm" showTier={false} />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{rec.champion.name}</p>
                                <p className="text-xs text-zinc-400 truncate max-w-[300px]">
                                  {rec.reasons.slice(0, 2).join(" · ") || "Chưa có dữ liệu"}
                                </p>
                              </div>
                              <span className="text-xs font-bold text-yellow-400">+{rec.score}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs h-7"
                                onClick={() => setAllyPicks([...allyPicks, rec.champion.slug])}
                              >
                                Pick
                              </Button>
                            </div>
                          ))
                        })()}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-8">
        <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-zinc-600 text-center">
          Wild Rift Picker — Patch {tiers.patch} | Dữ liệu tham khảo từ wildriftcore.com & wildriftcounter.com |
          <span className="block mt-1">Cập nhật dữ liệu: sửa file trong <code className="bg-zinc-800 px-1 rounded">data/</code> + deploy lại</span>
        </div>
      </footer>
    </div>
  )
}
