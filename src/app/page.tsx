"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import championsData from "@/data/champions.json"
import tiersData from "@/data/tiers.json"
import countersData from "@/data/counters.json"
import synergiesData from "@/data/synergies.json"
import { Card, CardContent } from "@/components/ui/card"
import { Search, X, Shield, Swords, Users, ChevronDown, ChevronUp } from "lucide-react"

type Champion = { id: string | number; name: string; slug: string; icon: string; tier: string; lanes: string[]; roles: string[]; win_rate?: number }
type TierInfo = { overall: string; by_role: Record<string, string>; win_rate?: number }
type CounterInfo = { strong_against: string[]; weak_against: string[] }
type SynergyInfo = { with: string; description: string; type: string }
type SortMode = "name" | "tier" | "winrate"

const LANES = ["baron", "jungle", "mid", "adc", "support"] as const
const LANE_CONFIG: Record<string, { label: string; icon: string }> = {
  baron: { label: "Baron", icon: "🛡️" },
  jungle: { label: "Jungle", icon: "🌿" },
  mid: { label: "Mid", icon: "⚡" },
  adc: { label: "ADC", icon: "🎯" },
  support: { label: "Supp", icon: "💎" },
}
const TIER_LABELS = ["S+", "S", "A", "B", "C"] as const
const TIER_COLORS: Record<string, string> = {
  "S+": "#dc2626", "S": "#ea580c", "A": "#16a34a", "B": "#2563eb", "C": "#6b7280"
}
const TIER_GLOW: Record<string, string> = {
  "S+": "0 0 6px rgba(220,38,38,0.3)",
  "S": "0 0 6px rgba(234,88,12,0.3)",
  "A": "0 0 6px rgba(22,163,74,0.3)",
  "B": "0 0 6px rgba(37,99,235,0.3)",
  "C": "none",
}

const champions = championsData as Champion[]
const tiers = tiersData as { patch: string; champions: Record<string, TierInfo> }
const counters = countersData as Record<string, CounterInfo>
const synergies = synergiesData as Record<string, { synergies: SynergyInfo[] }>

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLane, setSelectedLane] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>("tier")
  const [selectedChamp, setSelectedChamp] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => { searchRef.current?.focus() }, [])

  const getChampion = (slug: string): Champion | undefined =>
    champions.find(c => c.slug === slug)

  const getTier = (slug: string, lane?: string | null): string => {
    const info = tiers.champions[slug]
    if (!info) return "B"
    if (lane && info.by_role[lane]) return info.by_role[lane]
    return info.overall || "B"
  }

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

  const sortedChampions = useMemo(() => {
    const tierOrder = ["S+", "S", "A", "B", "C"]
    return [...filteredChampions].sort((a, b) => {
      if (sortMode === "name") return a.name.localeCompare(b.name)
      if (sortMode === "winrate") {
        const wa = a.win_rate ?? 0
        const wb = b.win_rate ?? 0
        return wb - wa
      }
      // sort by tier
      const tA = tierOrder.indexOf(getTier(a.slug, selectedLane))
      const tB = tierOrder.indexOf(getTier(b.slug, selectedLane))
      return tA - tB
    })
  }, [filteredChampions, sortMode, selectedLane])

  const getCounters = (slug: string): { strong: Champion[]; weak: Champion[] } => {
    const c = counters[slug]
    if (!c) return { strong: [], weak: [] }
    return {
      strong: c.strong_against.map(s => getChampion(s)).filter(Boolean) as Champion[],
      weak: c.weak_against.map(s => getChampion(s)).filter(Boolean) as Champion[]
    }
  }

  const getTopSynergies = (slug: string): { champion: Champion; desc: string }[] => {
    const syn = synergies[slug]?.synergies || []
    return syn.slice(0, 6).map(s => {
      const c = getChampion(s.with)
      return c ? { champion: c, desc: s.description } : null
    }).filter(Boolean) as { champion: Champion; desc: string }[]
  }

  const selectedData = selectedChamp ? getChampion(selectedChamp) : null
  const counterData = selectedChamp ? getCounters(selectedChamp) : { strong: [], weak: [] }
  const synergyData = selectedChamp ? getTopSynergies(selectedChamp) : []

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0e6d2]">
      {/* Header */}
      <header className="border-b border-[#c8aa6e]/20 bg-gradient-to-b from-[#0f0f1a] to-[#0a0a0f] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 py-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c8aa6e] to-[#8a6d2b] flex items-center justify-center text-xs font-bold text-[#010101] shadow-[0_0_10px_rgba(200,170,110,0.3)] shrink-0">
            WR
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#c8aa6e]/50" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Tìm tướng..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg pl-8 pr-7 py-1.5 text-xs text-[#f0e6d2] placeholder:text-[#7a7568] focus:outline-none focus:border-[#c8aa6e]/40 transition-all"
            />
            {searchQuery && (
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7a7568] hover:text-[#f0e6d2]" onClick={() => setSearchQuery("")}>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-[#7a7568]">
            <span className="text-red-400">S+</span>
            <span className="text-orange-400">S</span>
            <span className="text-green-400">A</span>
            <span className="text-blue-400">B</span>
            <span className="text-gray-500">C</span>
          </div>
        </div>
      </header>

      {/* Controls: lane + sort */}
      <div className="max-w-7xl mx-auto px-3 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {/* Lane filter */}
          <button
            onClick={() => setSelectedLane(null)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all border shrink-0 ${
              !selectedLane
                ? 'bg-[#c8aa6e]/20 border-[#c8aa6e] text-[#f0e6d2]'
                : 'bg-[#1a1a2e] border-[#2a2a3e] text-[#7a7568] hover:border-[#c8aa6e]/40'
            }`}
          >
            All
          </button>
          {LANES.map(lane => {
            const active = selectedLane === lane
            const cfg = LANE_CONFIG[lane]
            return (
              <button
                key={lane}
                onClick={() => setSelectedLane(active ? null : lane)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all border shrink-0 ${
                  active
                    ? 'bg-[#c8aa6e]/20 border-[#c8aa6e] text-[#f0e6d2] shadow-[0_0_6px_rgba(200,170,110,0.1)]'
                    : 'bg-[#1a1a2e] border-[#2a2a3e] text-[#7a7568] hover:border-[#c8aa6e]/40'
                }`}
              >
                {cfg.icon} {cfg.label}
              </button>
            )
          })}
          <div className="flex-1" />

          {/* Sort controls */}
          <div className="flex items-center gap-1 bg-[#1a1a2e] rounded-lg border border-[#2a2a3e] p-0.5">
            {([
              { id: "tier" as SortMode, label: "Tier" },
              { id: "name" as SortMode, label: "A-Z" },
              { id: "winrate" as SortMode, label: "WR%" },
            ]).map(s => (
              <button
                key={s.id}
                onClick={() => setSortMode(s.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                  sortMode === s.id
                    ? 'bg-[#c8aa6e]/15 text-[#c8aa6e]'
                    : 'text-[#7a7568] hover:text-[#a09b8c]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content: champion grid + detail panel */}
      <div className="max-w-7xl mx-auto px-3 pb-4">
        <div className="flex gap-3">
          {/* Champion grid */}
          <div className={`${selectedChamp ? 'hidden lg:block lg:w-2/3' : 'w-full'}`}>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-14 gap-1">
              {sortedChampions.map(c => {
                const tier = getTier(c.slug, selectedLane)
                return (
                  <div
                    key={c.slug}
                    className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-150 hover:scale-105 ${
                      selectedChamp === c.slug ? 'ring-1 ring-[#c8aa6e] rounded-lg' : ''
                    }`}
                    onClick={() => setSelectedChamp(selectedChamp === c.slug ? null : c.slug)}
                  >
                    <div
                      className="rounded-lg overflow-hidden border-2 relative"
                      style={{
                        width: 48,
                        height: 48,
                        borderColor: TIER_COLORS[tier] || '#6b7280',
                        boxShadow: TIER_GLOW[tier] || 'none',
                      }}
                    >
                      <img
                        src={`/champions/${c.slug}.webp`}
                        alt={c.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://cdn.communitydragon.org/latest/champion/${c.slug}/tile.jpg`
                        }}
                      />
                      <div
                        className="absolute top-0 right-0 bg-black/70 px-0.5 text-[7px] font-bold leading-tight"
                        style={{ color: TIER_COLORS[tier] || '#999' }}
                      >
                        {tier}
                      </div>
                    </div>
                    <span className="text-[9px] text-[#a09b8c] text-center leading-tight truncate max-w-[52px]">
                      {c.name}
                    </span>
                  </div>
                )
              })}
              {sortedChampions.length === 0 && (
                <div className="col-span-full text-center py-12 text-[#7a7568] text-xs">
                  Không tìm thấy tướng nào
                </div>
              )}
            </div>
            {sortedChampions.length > 0 && (
              <p className="text-[9px] text-[#7a7568] mt-1.5 text-center">
                {sortedChampions.length} tướng · click để xem chi tiết
              </p>
            )}
          </div>

          {/* Detail panel */}
          {selectedData && (
            <div className={`${selectedChamp ? 'w-full lg:w-1/3' : 'hidden'} space-y-2`}>
              {/* Champion info */}
              <Card className="bg-[#1a1a2e] border-[#2a2a3e]">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-lg overflow-hidden border-2 shrink-0"
                      style={{
                        width: 56,
                        height: 56,
                        borderColor: TIER_COLORS[getTier(selectedData.slug, selectedLane)] || '#6b7280',
                        boxShadow: TIER_GLOW[getTier(selectedData.slug, selectedLane)] || 'none',
                      }}
                    >
                      <img
                        src={`/champions/${selectedData.slug}.webp`}
                        alt={selectedData.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://cdn.communitydragon.org/latest/champion/${selectedData.slug}/tile.jpg`
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm">{selectedData.name}</h3>
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#0a0a0f]" style={{ color: TIER_COLORS[getTier(selectedData.slug, selectedLane)] }}>
                          {getTier(selectedData.slug, selectedLane)}
                        </span>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {selectedData.lanes.map(l => (
                          <span key={l} className="text-[9px] px-1.5 py-0.5 bg-[#0a0a0f] rounded border border-[#2a2a3e] text-[#7a7568]">
                            {LANE_CONFIG[l]?.icon} {LANE_CONFIG[l]?.label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedChamp(null)}
                      className="text-[#7a7568] hover:text-[#f0e6d2] shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Strong against */}
              {counterData.strong.length > 0 && (
                <Card className="bg-[#1a1a2e] border-[#2a2a3e]">
                  <CardContent className="p-3 space-y-1.5">
                    <h4 className="text-[11px] font-semibold text-green-400 flex items-center gap-1.5">
                      <Shield className="w-3 h-3" /> Counter — Nên chọn
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {counterData.strong.map(c => (
                        <div
                          key={c.slug}
                          className="flex items-center gap-1.5 p-1 bg-[#0a0a0f] rounded-lg cursor-pointer hover:bg-[#1a1a2e] transition-colors"
                          onClick={() => setSelectedChamp(c.slug)}
                        >
                          <div
                            className="rounded overflow-hidden border shrink-0"
                            style={{ width: 28, height: 28, borderColor: TIER_COLORS[getTier(c.slug)] || '#6b7280' }}
                          >
                            <img
                              src={`/champions/${c.slug}.webp`}
                              alt={c.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://cdn.communitydragon.org/latest/champion/${c.slug}/tile.jpg`
                              }}
                            />
                          </div>
                          <span className="text-[10px] truncate max-w-[60px]">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Weak against */}
              {counterData.weak.length > 0 && (
                <Card className="bg-[#1a1a2e] border-[#2a2a3e]">
                  <CardContent className="p-3 space-y-1.5">
                    <h4 className="text-[11px] font-semibold text-red-400 flex items-center gap-1.5">
                      <Swords className="w-3 h-3" /> Yếu thế — Nên tránh
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {counterData.weak.map(c => (
                        <div
                          key={c.slug}
                          className="flex items-center gap-1.5 p-1 bg-[#0a0a0f] rounded-lg cursor-pointer hover:bg-[#1a1a2e] transition-colors"
                          onClick={() => setSelectedChamp(c.slug)}
                        >
                          <div
                            className="rounded overflow-hidden border shrink-0"
                            style={{ width: 28, height: 28, borderColor: TIER_COLORS[getTier(c.slug)] || '#6b7280' }}
                          >
                            <img
                              src={`/champions/${c.slug}.webp`}
                              alt={c.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://cdn.communitydragon.org/latest/champion/${c.slug}/tile.jpg`
                              }}
                            />
                          </div>
                          <span className="text-[10px] truncate max-w-[60px]">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Synergy */}
              {synergyData.length > 0 && (
                <Card className="bg-[#1a1a2e] border-[#2a2a3e]">
                  <CardContent className="p-3 space-y-1.5">
                    <h4 className="text-[11px] font-semibold text-[#c8aa6e] flex items-center gap-1.5">
                      <Users className="w-3 h-3" /> Đồng minh tốt
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {synergyData.slice(0, 4).map((syn, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 p-1 bg-[#0a0a0f] rounded-lg cursor-pointer hover:bg-[#1a1a2e] transition-colors max-w-[200px]"
                          onClick={() => setSelectedChamp(syn.champion.slug)}
                        >
                          <div
                            className="rounded overflow-hidden border shrink-0"
                            style={{ width: 28, height: 28, borderColor: TIER_COLORS[getTier(syn.champion.slug)] || '#6b7280' }}
                          >
                            <img
                              src={`/champions/${syn.champion.slug}.webp`}
                              alt={syn.champion.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://cdn.communitydragon.org/latest/champion/${syn.champion.slug}/tile.jpg`
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-medium block truncate">{syn.champion.name}</span>
                            <span className="text-[8px] text-[#7a7568] block truncate">{syn.desc.slice(0, 40)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#2a2a3e]">
        <div className="max-w-7xl mx-auto px-3 py-2 text-[8px] text-[#7a7568] text-center space-y-0.5">
          <p>Wild Rift Picker — Patch {tiers.patch} · {champions.length} champions</p>
          <p>Dữ liệu: wildriftcore.com, wildriftcounter.com · Ảnh: CommunityDragon</p>
          <p>
            <a href="https://github.com/hoanghus/wild-rift-picker" target="_blank" rel="noopener noreferrer"
              className="text-[#c8aa6e]/60 hover:text-[#c8aa6e]">GitHub</a>
          </p>
        </div>
      </footer>
    </div>
  )
}
