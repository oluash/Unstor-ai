import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RefreshCw, Network } from "lucide-react";

interface GraphNode extends d3.SimulationNodeDatum {
  id: number;
  nodeKey: string;
  topic: string;
  category: string | null;
  frequency: number;
  confidenceScore: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: GraphNode | number;
  target: GraphNode | number;
  strength: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  quantum_physics:       "oklch(0.65 0.22 280)",
  ifa_studies:           "oklch(0.65 0.18 45)",
  psychology:            "oklch(0.65 0.18 145)",
  epigenetics:           "oklch(0.65 0.18 195)",
  alternative_medicine:  "oklch(0.65 0.18 320)",
  medical_education:     "oklch(0.65 0.18 15)",
  yoruba_language:       "oklch(0.65 0.18 260)",
  philosophy:            "oklch(0.65 0.18 90)",
  general:               "oklch(0.55 0.01 260)",
};

function getCategoryColor(category: string | null): string {
  if (!category) return CATEGORY_COLORS.general;
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (category.toLowerCase().includes(key.replace("_", " ")) || category.toLowerCase() === key) {
      return color;
    }
  }
  return CATEGORY_COLORS.general;
}

export default function KnowledgeGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: GraphNode } | null>(null);
  const [nodeLimit, setNodeLimit] = useState(80);

  const { data: nodes, isLoading, refetch } = trpc.knowledge.getNodes.useQuery(
    { limit: nodeLimit },
    { refetchOnWindowFocus: false }
  );
  const { data: edges } = trpc.knowledge.getEdges.useQuery(
    undefined,
    { refetchOnWindowFocus: false }
  );

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !nodes || nodes.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 500;

    // Clear previous render
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Zoom behaviour
    const g = svg.append("g");
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    svg.call(zoom);

    // Build graph data
    const graphNodes: GraphNode[] = nodes.map((n) => ({
      id: n.id,
      nodeKey: n.nodeKey,
      topic: n.topic,
      category: n.category,
      frequency: n.frequency,
      confidenceScore: n.confidenceScore,
    }));

    const nodeIdSet = new Set(graphNodes.map((n) => n.id));
    const graphLinks: GraphLink[] = (edges ?? [])
      .filter((e) => nodeIdSet.has(e.fromNodeId) && nodeIdSet.has(e.toNodeId))
      .map((e) => ({
        source: e.fromNodeId,
        target: e.toNodeId,
        strength: e.strength,
      }));

    // Force simulation
    const simulation = d3
      .forceSimulation<GraphNode>(graphNodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(graphLinks)
          .id((d) => d.id)
          .distance(60)
          .strength((d) => (d.strength ?? 0.5) * 0.8)
      )
      .force("charge", d3.forceManyBody().strength(-120))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d) => nodeRadius(d as GraphNode) + 4));

    // Render links
    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(graphLinks)
      .join("line")
      .attr("stroke", "oklch(0.25 0.02 260)")
      .attr("stroke-width", (d) => Math.max(0.5, (d.strength ?? 0.5) * 2))
      .attr("stroke-opacity", 0.6);

    // Render nodes
    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(graphNodes)
      .join("circle")
      .attr("r", (d) => nodeRadius(d))
      .attr("fill", (d) => getCategoryColor(d.category))
      .attr("fill-opacity", 0.85)
      .attr("stroke", "oklch(0.15 0.02 260)")
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        const rect = svgRef.current!.getBoundingClientRect();
        setTooltip({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          node: d,
        });
      })
      .on("mouseout", () => setTooltip(null))
      .call(
        d3.drag<SVGCircleElement, GraphNode>()
          .on("start", (_event, d) => {
            if (!_event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (_event, d) => {
            d.fx = _event.x;
            d.fy = _event.y;
          })
          .on("end", (_event, d) => {
            if (!_event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as unknown as (selection: d3.Selection<d3.BaseType | SVGCircleElement, GraphNode, SVGGElement, unknown>) => void
      );

    // Labels for high-frequency nodes
    const label = g
      .append("g")
      .attr("class", "labels")
      .selectAll("text")
      .data(graphNodes.filter((d) => d.frequency >= 3))
      .join("text")
      .attr("font-size", "9px")
      .attr("fill", "oklch(0.80 0.01 260)")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => -nodeRadius(d) - 3)
      .text((d) => d.topic.length > 18 ? d.topic.slice(0, 18) + "…" : d.topic)
      .style("pointer-events", "none");

    // Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as GraphNode).x ?? 0)
        .attr("y1", (d) => (d.source as GraphNode).y ?? 0)
        .attr("x2", (d) => (d.target as GraphNode).x ?? 0)
        .attr("y2", (d) => (d.target as GraphNode).y ?? 0);

      node.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);
      label.attr("x", (d) => d.x ?? 0).attr("y", (d) => d.y ?? 0);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, edges]);

  function nodeRadius(d: GraphNode): number {
    return Math.max(4, Math.min(16, 4 + d.frequency * 0.8 + d.confidenceScore * 4));
  }

  function handleZoom(factor: number) {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
      factor
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold text-sm">Knowledge Graph</h3>
          {nodes && (
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
              {nodes.length} nodes
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[40, 80, 150].map((n) => (
              <Button
                key={n}
                variant={nodeLimit === n ? "default" : "outline"}
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => setNodeLimit(n)}
              >
                {n}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="icon" className="w-7 h-7" onClick={() => refetch()}>
            <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-b border-border/50 flex flex-wrap gap-3">
        {Object.entries(CATEGORY_COLORS).filter(([k]) => k !== "general").map(([key, color]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-xs text-muted-foreground capitalize">{key.replace("_", " ")}</span>
          </div>
        ))}
      </div>

      {/* Graph canvas */}
      <div ref={containerRef} className="relative w-full" style={{ height: "480px" }}>
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Network className="w-4 h-4 animate-pulse text-primary" />
              Building knowledge graph…
            </div>
          </div>
        ) : !nodes || nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Network className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">No knowledge nodes yet.</p>
              <p className="text-xs text-muted-foreground">Start chatting to build the graph.</p>
            </div>
          </div>
        ) : (
          <svg ref={svgRef} className="w-full h-full" style={{ background: "transparent" }} />
        )}

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-20 pointer-events-none bg-popover border border-border rounded-lg p-3 shadow-lg max-w-[220px]"
            style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
          >
            <div className="font-medium text-sm text-foreground truncate">{tooltip.node.topic}</div>
            {tooltip.node.category && (
              <div className="text-xs text-muted-foreground mt-0.5 capitalize">
                {tooltip.node.category.replace("_", " ")}
              </div>
            )}
            <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
              <span>Freq: <span className="text-foreground">{tooltip.node.frequency}</span></span>
              <span>Conf: <span className="text-foreground">{(tooltip.node.confidenceScore * 100).toFixed(0)}%</span></span>
            </div>
          </div>
        )}

        {/* Zoom controls */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1">
          <Button
            variant="outline"
            size="icon"
            className="w-7 h-7 bg-background/80 backdrop-blur-sm"
            onClick={() => handleZoom(1.3)}
          >
            <ZoomIn className="w-3 h-3" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-7 h-7 bg-background/80 backdrop-blur-sm"
            onClick={() => handleZoom(0.77)}
          >
            <ZoomOut className="w-3 h-3" />
          </Button>
        </div>

        {/* Hint */}
        <div className="absolute bottom-3 left-3 text-xs text-muted-foreground/50">
          Drag nodes · Scroll to zoom
        </div>
      </div>
    </div>
  );
}
