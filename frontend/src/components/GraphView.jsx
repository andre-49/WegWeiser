import React, { useEffect, useRef } from "react";
import Graph from "graphology";
import { Sigma } from "sigma";

const OCCUPATION_GROUPS = [
  "pet and pet food shop manager",
  "Shopping for own household and family members",
  "Unpaid community- and organization-based volunteering",
  "Food and meals management and preparation",
  "Cleaning and maintaining of own dwelling and surroundings",
  "Construction managers",
  "Health services managers",
  "Software developers",
  "Computer network professionals",
];

function GraphView() {
  const containerRef = useRef(null);
  const sigmaInstanceRef = useRef(null);
  const dataRef = useRef({ nodes: [], edges: [] });
  const graphRef = useRef(null);
  const skillsVisibleRef = useRef(false);
  const expandedOccupationRef = useRef(null);

  // Base sizes
  const baseSizes = {
    group: 20,
    occupation: 18,
    skill: 7,
  };

  // Label behavior: show occupation labels when zoomed IN (ratio <= threshold)
  const OCC_LABEL_SHOW_RATIO_THRESHOLD = 1.1;

  const fitToScreen = () => {
    const s = sigmaInstanceRef.current;
    if (!s) return;
    // Center & fit: Sigma uses a normalized [0..1] space; ratio=1 fits graph into viewport
    s.getCamera().setState({ x: 0.5, y: 0.5, ratio: 1 });
    s.refresh();
  };

  const toggleOccupationLabels = (zoomRatio) => {
    const s = sigmaInstanceRef.current;
    const g = graphRef.current;
    if (!s || !g) return;

    const show = zoomRatio <= OCC_LABEL_SHOW_RATIO_THRESHOLD;

    g.forEachNode((id, attrs) => {
      if (attrs.customType !== "occupation") return;

      // Ensure originalLabel is recorded once
      if (typeof attrs.originalLabel === "undefined") {
        g.setNodeAttribute(id, "originalLabel", attrs.label || "");
      }

      const shouldBe = show ? attrs.originalLabel || "" : "";
      if (attrs.label !== shouldBe) {
        g.setNodeAttribute(id, "label", shouldBe);
      }
    });

    s.refresh();
  };

  const updateNodeSizes = (zoomRatio) => {
    const g = graphRef.current;
    const s = sigmaInstanceRef.current;
    if (!g) return;

    g.forEachNode((nodeId, attributes) => {
      const nodeType = attributes.customType;
      let newSize = attributes.size;

      switch (nodeType) {
        case "group":
          // Smaller as you zoom IN
          newSize = baseSizes.group * Math.sqrt(zoomRatio);
          break;
        case "occupation":
          // If skills are visible, keep occupation size steady; else, grow as you zoom IN
          newSize = skillsVisibleRef.current
            ? baseSizes.occupation
            : Math.max(baseSizes.occupation * (1 / zoomRatio), 4);
          break;
        case "skill":
          // Slight response to zoom
          newSize = baseSizes.skill * Math.pow(zoomRatio, 0.3);
          break;
        default:
          break;
      }

      g.setNodeAttribute(nodeId, "size", newSize);
    });

    if (s) s.refresh();
  };

  const collapseAllSkills = () => {
    const g = graphRef.current;
    if (!g) return;

    const toDrop = [];
    g.forEachNode((id, attrs) => {
      if (attrs.customType === "skill") toDrop.push(id);
    });
    toDrop.forEach((id) => g.dropNode(id));
    skillsVisibleRef.current = false;
    expandedOccupationRef.current = null;
  };

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      // Kill previous instance if hot-reloading
      if (sigmaInstanceRef.current) {
        sigmaInstanceRef.current.kill();
        sigmaInstanceRef.current = null;
      }

      try {
        // Fetch all nodes & edges
        const [nodesRes, edgesRes] = await Promise.all([
          fetch("http://127.0.0.1:8001/nodes").then((r) => r.json()),
          fetch("http://127.0.0.1:8001/edges").then((r) => r.json()),
        ]);

        dataRef.current = { nodes: nodesRes.nodes, edges: edgesRes.edges };

        const g = new Graph();

        // Filter group nodes by OCCUPATION_GROUPS
        const groupNodes = nodesRes.nodes.filter(
          (n) => n.type === "group" && OCCUPATION_GROUPS.includes(n.title)
        );
        const groupIds = new Set(groupNodes.map((n) => n.id));

        // Occupations linked to those groups
        const occEdges = edgesRes.edges.filter(
          (e) => e.type === "group_occupation" && groupIds.has(e.source)
        );
        const occupationIds = new Set(occEdges.map((e) => e.target));
        const occupationNodes = nodesRes.nodes.filter((n) =>
          occupationIds.has(n.id)
        );

        // Add groups
        groupNodes.forEach((node) => {
          g.addNode(node.id, {
            label: node.title,
            originalLabel: node.title,
            customType: "group",
            x: Math.random() * 1000,
            y: Math.random() * 1000,
            size: baseSizes.group,
            color: "#0074D9",
          });
        });

        // Add occupations
        occupationNodes.forEach((node) => {
          g.addNode(node.id, {
            label: node.title,
            originalLabel: node.title,
            customType: "occupation",
            x: Math.random() * 1000,
            y: Math.random() * 1000,
            size: baseSizes.occupation,
            color: "#2ECC40",
          });
        });

        // Add group-occupation edges
        occEdges.forEach((edge, i) => {
          const key = `${edge.source}->${edge.target}-${i}`;
          if (!g.hasEdge(key)) {
            g.addEdgeWithKey(key, edge.source, edge.target, {
              type: "line",
              label: edge.type,
              color: "#0074D9",
            });
          }
        });

        if (containerRef.current && isMounted) {
          // Initialize Sigma with small stagePadding; keep labels on (we manage visibility ourselves)
          const s = new Sigma(g, containerRef.current, {
            stagePadding: 8,
            hideLabelsOnMove: false,
            renderLabels: true,
            labelRenderedSizeThreshold: 4, // keep permissive; our toggle governs visibility
          });

          sigmaInstanceRef.current = s;
          graphRef.current = g;

          // Camera events: size + label updates
          const camera = s.getCamera();
          const onCameraUpdated = (state) => {
            const ratio = state.ratio;
            updateNodeSizes(ratio);
            toggleOccupationLabels(ratio);
          };
          camera.on("updated", onCameraUpdated);

          // Node click: expand/collapse skills for one occupation at a time
          s.on("clickNode", ({ node }) => {
            const attrs = g.getNodeAttributes(node);
            if (attrs.customType !== "occupation") return;

            // Toggle: if same occupation clicked, collapse
            if (expandedOccupationRef.current === node) {
              collapseAllSkills();
              // Update sizes/labels for current zoom
              const r = camera.getState().ratio;
              updateNodeSizes(r);
              toggleOccupationLabels(r);
              return;
            }

            // New occupation: collapse any previous skills then add new ones
            collapseAllSkills();

            const { nodes, edges } = dataRef.current;
            const occSkillEdges = edges.filter(
              (e) => e.type === "occ_skill" && e.source === node
            );

            occSkillEdges.forEach((edge, i) => {
              if (!g.hasNode(edge.target)) {
                const skillNode = nodes.find((n) => n.id === edge.target);
                if (!skillNode) return;

                g.addNode(skillNode.id, {
                  label: skillNode.title,
                  originalLabel: skillNode.title,
                  customType: "skill",
                  size: baseSizes.skill,
                  color: "#FF4136",
                  x: attrs.x + Math.random() * 50 - 25,
                  y: attrs.y + Math.random() * 50 - 25,
                });

                const ek = `${edge.source}->${edge.target}-skill-${i}`;
                g.addEdgeWithKey(ek, edge.source, edge.target, {
                  type: "line",
                  label: edge.type,
                  color: "#FF4136",
                });
              }
            });

            skillsVisibleRef.current = true;
            expandedOccupationRef.current = node;

            const r = camera.getState().ratio;
            updateNodeSizes(r);
            toggleOccupationLabels(r);
          });

          // Ensure initial view fits screen after the renderer measures the container
          requestAnimationFrame(() => {
            fitToScreen();
            // Also set initial label state based on the (now) current ratio
            const r = camera.getState().ratio;
            toggleOccupationLabels(r);
          });

          // Re-fit on container resize
          const ro = new ResizeObserver(() => {
            requestAnimationFrame(() => fitToScreen());
          });
          ro.observe(containerRef.current);

          // Cleanup
          return () => {
            ro.disconnect();
            camera.off("updated", onCameraUpdated);
          };
        }
      } catch (e) {
        console.error("Error fetching data:", e);
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
      if (sigmaInstanceRef.current) sigmaInstanceRef.current.kill();
    };
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          padding: "10px",
          background: "#f0f0f0",
          borderBottom: "1px solid #ccc",
          fontSize: "14px",
          color: "#444",
        }}
      >
        <strong>Interactive Network Graph</strong> — Zoom in to see occupation
        names, zoom out to hide them. Click an occupation to toggle its skills.
      </div>

      <div
        ref={containerRef}
        style={{
          height: "100vh",
          width: "100vw",
          background: "#fafafa",
        }}
      />

      {/* UI overlay */}
      <div
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          display: "flex",
          gap: 8,
          zIndex: 10,
        }}
      >
        <button
          onClick={fitToScreen}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #ccc",
            background: "#fff",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          }}
        >
          Reset view
        </button>
      </div>
    </div>
  );
}

export default GraphView;
