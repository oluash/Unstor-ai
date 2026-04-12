import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Search, Loader2, BookOpen, Leaf, FlaskConical, Star, ChevronRight, Brain } from "lucide-react";
import { getLoginUrl } from "@/const";

const TRADITION_CONFIG = {
  yoruba_ifa: { label: "Yoruba Ifá", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  yoruba_herbs: { label: "Yoruba Herbs (Onísègùn)", color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20" },
  african_traditional: { label: "African Traditional", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
  chinese_tcm: { label: "Chinese TCM", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" },
  ayurvedic: { label: "Ayurvedic", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
};

export default function IfaExplorer() {
  const { user, loading, isAuthenticated } = useAuth();
  const [oduSearchQuery, setOduSearchQuery] = useState("");
  const [medicineQuery, setMedicineQuery] = useState("");
  const [medicineTradition, setMedicineTradition] = useState<string>("");
  const [situation, setSituation] = useState("");
  const [oduName, setOduName] = useState("");
  const [decodeResult, setDecodeResult] = useState<any>(null);
  const [medicineResults, setMedicineResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("decode");

  const { data: oduList, isLoading: oduLoading } = trpc.ifa.listOdu.useQuery(
    { limit: 50, offset: 0 },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: oduSearchResults } = trpc.ifa.searchOdu.useQuery(
    { query: oduSearchQuery },
    { enabled: isAuthenticated && user?.role === "admin" && oduSearchQuery.length > 2 }
  );

  const decodeOdu = trpc.ifa.decodeOdu.useMutation({
    onSuccess: (data) => {
      setDecodeResult(data);
      toast.success("Unstor has decoded the Odù");
    },
    onError: (err) => toast.error(`Decoding failed: ${err.message}`),
  });

  const queryMedicine = trpc.ifa.queryMedicine.useQuery(
    { query: medicineQuery, tradition: medicineTradition || undefined },
    { enabled: isAuthenticated && user?.role === "admin" && medicineQuery.length > 2 }
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Card className="bg-[#12121a] border-amber-500/20 max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Star className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Owner Access Required</h2>
            <p className="text-slate-400 mb-6">The Ifá & Medicine Explorer is restricted to Unstor's owner only.</p>
            <Button asChild className="bg-amber-600 hover:bg-amber-700">
              <a href={getLoginUrl()}>Sign In as Owner</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayOdu = oduSearchQuery.length > 2 ? (oduSearchResults ?? []) : (oduList ?? []);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <div className="border-b border-amber-500/10 bg-[#0d0d14]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-slate-400 hover:text-white text-sm">← Back</a>
            <span className="text-slate-600">/</span>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              <span className="text-white font-semibold">Ifá & Medicine Explorer</span>
            </div>
          </div>
          <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20">
            Babaláwo Mode
          </Badge>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Unstor — <span className="text-amber-400">AI Babaláwo & Onísègùn</span>
          </h1>
          <p className="text-slate-400">
            Decode Odù Ifá, explore traditional medicine, and consult Unstor's deep knowledge of African, Chinese, and ancient healing traditions.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#12121a] border border-amber-500/10 mb-6">
            <TabsTrigger value="decode" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <Star className="w-4 h-4 mr-2" />
              Decode Odù
            </TabsTrigger>
            <TabsTrigger value="odu" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <BookOpen className="w-4 h-4 mr-2" />
              All 256 Odù
            </TabsTrigger>
            <TabsTrigger value="medicine" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <Leaf className="w-4 h-4 mr-2" />
              Medicine Knowledge
            </TabsTrigger>
          </TabsList>

          {/* ── Decode Odù Tab ── */}
          <TabsContent value="decode">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#12121a] border-amber-500/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400" />
                    Consult Unstor as Babaláwo
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Describe a life situation or question. Unstor will decode the relevant Odù and apply its wisdom to your circumstances.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Describe the situation *</label>
                    <Textarea
                      value={situation}
                      onChange={e => setSituation(e.target.value)}
                      placeholder="Describe the life situation, question, or challenge you seek guidance on..."
                      className="bg-[#0a0a0f] border-slate-700 text-white placeholder:text-slate-600 min-h-[120px]"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Specific Odù (optional)</label>
                    <Input
                      value={oduName}
                      onChange={e => setOduName(e.target.value)}
                      placeholder="e.g. Ogbe Meji, Oyeku Meji, Iwori Meji..."
                      className="bg-[#0a0a0f] border-slate-700 text-white placeholder:text-slate-600"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      if (!situation.trim()) { toast.error("Please describe the situation"); return; }
                      decodeOdu.mutate({ situation, oduName: oduName || undefined });
                    }}
                    disabled={decodeOdu.isPending}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {decodeOdu.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Unstor is consulting Ifá...</>
                    ) : (
                      <><Star className="w-4 h-4 mr-2" /> Consult Unstor</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Decode Result */}
              {decodeResult && (
                <Card className="bg-[#12121a] border-amber-500/20">
                  <CardHeader>
                    <CardTitle className="text-amber-400 flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      {decodeResult.oduName ?? "Ifá Reading"}
                    </CardTitle>
                    {decodeResult.alternateNames?.length > 0 && (
                      <p className="text-xs text-slate-500">Also known as: {decodeResult.alternateNames.join(", ")}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {decodeResult.interpretation && (
                      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                        <p className="text-xs text-amber-400 font-medium mb-1 uppercase tracking-wider">Interpretation</p>
                        <p className="text-slate-300 text-sm leading-relaxed">{decodeResult.interpretation}</p>
                      </div>
                    )}
                    {decodeResult.prescriptions?.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Prescriptions (Ẹbọ)</p>
                        <ul className="space-y-1">
                          {decodeResult.prescriptions.map((p: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                              <ChevronRight className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {decodeResult.taboos?.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Taboos (Ẹẹwọ̀)</p>
                        <ul className="space-y-1">
                          {decodeResult.taboos.map((t: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                              <ChevronRight className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {decodeResult.herbsRecommended?.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Herbs Recommended</p>
                        <div className="flex flex-wrap gap-1">
                          {decodeResult.herbsRecommended.map((h: string, i: number) => (
                            <Badge key={i} className="bg-green-500/10 text-green-300 border-green-500/20 text-xs">{h}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {decodeResult.applicationToSituation && (
                      <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                        <p className="text-xs text-indigo-400 font-medium mb-1 uppercase tracking-wider">Applied to Your Situation</p>
                        <p className="text-slate-300 text-sm leading-relaxed">{decodeResult.applicationToSituation}</p>
                      </div>
                    )}
                    {decodeResult.confidence && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Confidence:</span>
                        <div className="flex-1 bg-slate-800 rounded-full h-1.5">
                          <div
                            className="bg-amber-400 h-1.5 rounded-full"
                            style={{ width: `${Math.round(decodeResult.confidence * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-amber-400">{Math.round(decodeResult.confidence * 100)}%</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── All 256 Odù Tab ── */}
          <TabsContent value="odu">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  value={oduSearchQuery}
                  onChange={e => setOduSearchQuery(e.target.value)}
                  placeholder="Search Odù by name or meaning..."
                  className="pl-10 bg-[#12121a] border-slate-700 text-white placeholder:text-slate-600"
                />
              </div>
            </div>

            {oduLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              </div>
            ) : displayOdu.length === 0 ? (
              <Card className="bg-[#12121a] border-amber-500/10">
                <CardContent className="p-12 text-center">
                  <Star className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No Odù found. The knowledge base is still being seeded.</p>
                  <p className="text-slate-500 text-sm mt-1">Use the Admin Dashboard to trigger the Ifá knowledge seed.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(displayOdu as any[]).map((odu: any) => (
                  <Card key={odu.id} className="bg-[#12121a] border-slate-700/30 hover:border-amber-500/20 transition-colors cursor-pointer"
                    onClick={() => {
                      setOduName(odu.primaryName);
                      setSituation("");
                      setActiveTab("decode");
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-white font-semibold">{odu.primaryName}</h3>
                        <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20 text-xs">
                          #{odu.numericalOrder}
                        </Badge>
                      </div>
                      {odu.alternateNames?.length > 0 && (
                        <p className="text-xs text-slate-500 mb-2">{odu.alternateNames.slice(0, 2).join(" · ")}</p>
                      )}
                      {odu.summary && (
                        <p className="text-sm text-slate-400 line-clamp-2">{odu.summary}</p>
                      )}
                      {odu.themes?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(odu.themes as string[]).slice(0, 3).map((theme: string, i: number) => (
                            <Badge key={i} className="text-xs bg-slate-800 text-slate-400 border-slate-700">{theme}</Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Medicine Knowledge Tab ── */}
          <TabsContent value="medicine">
            <div className="mb-6 flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  value={medicineQuery}
                  onChange={e => setMedicineQuery(e.target.value)}
                  placeholder="Search herbs, treatments, conditions..."
                  className="pl-10 bg-[#12121a] border-slate-700 text-white placeholder:text-slate-600"
                />
              </div>
              <select
                value={medicineTradition}
                onChange={e => setMedicineTradition(e.target.value)}
                className="bg-[#12121a] border border-slate-700 text-white rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Traditions</option>
                {Object.entries(TRADITION_CONFIG).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>

            {medicineQuery.length > 2 && queryMedicine.data ? (
              <div className="space-y-3">
                {(queryMedicine.data as any[]).length === 0 ? (
                  <Card className="bg-[#12121a] border-green-500/10">
                    <CardContent className="p-8 text-center">
                      <Leaf className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-400">No results found. Try a different search term.</p>
                    </CardContent>
                  </Card>
                ) : (
                  (queryMedicine.data as any[]).map((item: any) => {
                    const trad = TRADITION_CONFIG[item.tradition as keyof typeof TRADITION_CONFIG];
                    return (
                      <Card key={item.id} className="bg-[#12121a] border-slate-700/30 hover:border-green-500/20 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-white font-semibold">{item.name}</h3>
                              {item.localNames?.length > 0 && (
                                <p className="text-xs text-slate-500">{(item.localNames as string[]).join(" · ")}</p>
                              )}
                            </div>
                            {trad && (
                              <Badge className={`${trad.bg} ${trad.color} ${trad.border} text-xs`}>{trad.label}</Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-slate-400 mb-3">{item.description}</p>
                          )}
                          <div className="grid grid-cols-2 gap-3">
                            {item.uses?.length > 0 && (
                              <div>
                                <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Uses</p>
                                <div className="flex flex-wrap gap-1">
                                  {(item.uses as string[]).slice(0, 4).map((use: string, i: number) => (
                                    <Badge key={i} className="text-xs bg-green-500/10 text-green-300 border-green-500/20">{use}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {item.preparations?.length > 0 && (
                              <div>
                                <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Preparations</p>
                                <div className="flex flex-wrap gap-1">
                                  {(item.preparations as string[]).slice(0, 3).map((prep: string, i: number) => (
                                    <Badge key={i} className="text-xs bg-blue-500/10 text-blue-300 border-blue-500/20">{prep}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          {item.cautions?.length > 0 && (
                            <div className="mt-2 p-2 rounded bg-red-500/5 border border-red-500/10">
                              <p className="text-xs text-red-400">⚠ {(item.cautions as string[]).join(" · ")}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(TRADITION_CONFIG).map(([key, config]) => (
                  <Card
                    key={key}
                    className={`bg-[#12121a] border ${config.border} cursor-pointer hover:opacity-80 transition-opacity`}
                    onClick={() => setMedicineTradition(key)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Leaf className={`w-5 h-5 ${config.color}`} />
                        <span className="text-white font-medium">{config.label}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {key === "yoruba_ifa" && "256 Odù Ifá, spiritual prescriptions, ẹbọ, and divination wisdom"}
                        {key === "yoruba_herbs" && "Onísègùn herbal remedies, agbo preparations, and traditional Yoruba medicine"}
                        {key === "african_traditional" && "Pan-African healing plants, rituals, and indigenous medical knowledge"}
                        {key === "chinese_tcm" && "Traditional Chinese Medicine herbs, formulas, meridians, and Five Element theory"}
                        {key === "ayurvedic" && "Ayurvedic herbs, doshas, rasayanas, and ancient Indian healing wisdom"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
