import React, { useEffect, useRef, useState } from "react";
import Graph from "graphology";
import { Sigma } from "sigma";
import SideBar from "../ui/SideBar";
import OccupationDetails from "../ui/OccupationDetails";

const OCCUPATION_TITLES = [
  "pet and pet food shop manager",
  "Shopping for own household and family members",
  "Unpaid community- and organization-based volunteering",
  "Food and meals management and preparation",
  // "Cleaning and maintaining of own dwelling and surroundings",
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

  const [selectedOccupation, setSelectedOccupation] = useState(null);

  // Base sizes
  const baseSizes = {
    occupation: 18,
    skill: 7,
  };

  // Label behavior: show occupation labels when zoomed IN (ratio <= threshold)
  const OCC_LABEL_SHOW_RATIO_THRESHOLD = 1.1;

  const fitToScreen = () => {
    const s = sigmaInstanceRef.current;
    if (!s) return;
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
        case "occupation":
          newSize = skillsVisibleRef.current
            ? baseSizes.occupation
            : Math.max(baseSizes.occupation * (1 / zoomRatio), 4);
          break;
        case "skill":
          newSize = baseSizes.skill * Math.pow(zoomRatio, 0.3);
          break;
        default:
          break;
      }
      const labelColorVar = "#ffffff";
      g.setNodeAttribute(nodeId, "size", newSize);
      g.setNodeAttribute(nodeId, "labelColor", labelColorVar);
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
      if (sigmaInstanceRef.current) {
        sigmaInstanceRef.current.kill();
        sigmaInstanceRef.current = null;
      }

      try {
        const [nodesRes, edgesRes] = await Promise.all([
          fetch("http://127.0.0.1:8001/nodes").then((r) => r.json()),
          fetch("http://127.0.0.1:8001/edges").then((r) => r.json()),
        ]);

        dataRef.current = { nodes: nodesRes.nodes, edges: edgesRes.edges };
        const g = new Graph();

        // Use the same logic as before but skip adding group nodes
        const groupNodes = nodesRes.nodes.filter(
          (n) => n.type === "group" && OCCUPATION_TITLES.includes(n.title)
        );

        const groupIds = new Set(groupNodes.map((n) => n.id));

        const occEdges = edgesRes.edges.filter(
          (e) => e.type === "group_occupation" && groupIds.has(e.source)
        );
        const occupationIds = new Set(occEdges.map((e) => e.target));
        const occupationNodes = nodesRes.nodes.filter((n) =>
          occupationIds.has(n.id)
        );

        // Add occupation nodes
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
        // renderer = new Sigma(graph, container, {
        //   renderLabels: true,
        //   labelColor: { attribute: "labelColor" }, // Tell Sigma to use this attribute
        // });
        if (containerRef.current && isMounted) {
          const s = new Sigma(g, containerRef.current, {
            stagePadding: 8,
            hideLabelsOnMove: false,
            renderLabels: true,
            labelColor: {attribute: "labelColor"},
            labelRenderedSizeThreshold: 2,
          });

          sigmaInstanceRef.current = s;
          graphRef.current = g;

          const camera = s.getCamera();
          const onCameraUpdated = (state) => {
            const ratio = state.ratio;
            updateNodeSizes(ratio);
            toggleOccupationLabels(ratio);
          };
          camera.on("updated", onCameraUpdated);

          s.on("clickNode", ({ node }) => {
            const attrs = g.getNodeAttributes(node);
            if (attrs.customType !== "occupation") return;

            setSelectedOccupation(attrs); // NEW: set selected occupation

            if (expandedOccupationRef.current === node) {
              collapseAllSkills();
              const r = camera.getState().ratio;
              updateNodeSizes(r);
              toggleOccupationLabels(r);
              return;
            }

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

            // Focus zoom specifically on the skills area, not the occupation
            const skillNodeIds = occSkillEdges.map((e) => e.target);

            if (skillNodeIds.length > 0) {
              // Zoom to focus on skills only
              const skillsBbox = g.getBBox(skillNodeIds);
              const padding = 80; // Padding around skills

              camera.animate(
                {
                  x: (skillsBbox.x1 + skillsBbox.x2) / 2,
                  y: (skillsBbox.y1 + skillsBbox.y2) / 2,
                  ratio: Math.min(
                    (skillsBbox.x2 - skillsBbox.x1 + padding) /
                      containerRef.current.offsetWidth,
                    (skillsBbox.y2 - skillsBbox.y1 + padding) /
                      containerRef.current.offsetHeight,
                    0.1 // Higher zoom level to focus on skills
                  ),
                },
                { duration: 800, easing: "quadInOut" }
              );
            } else {
              // If no skills, just zoom to the occupation
              camera.animate(
                {
                  x: attrs.x,
                  y: attrs.y,
                  ratio: 0.2,
                },
                { duration: 800, easing: "quadInOut" }
              );
            }

            const r = camera.getState().ratio;
            updateNodeSizes(r);
            toggleOccupationLabels(r);
          });

          requestAnimationFrame(() => {
            fitToScreen();
            const r = camera.getState().ratio;
            toggleOccupationLabels(r);
          });

          const ro = new ResizeObserver(() => {
            requestAnimationFrame(() => fitToScreen());
          });
          ro.observe(containerRef.current);

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

  console.log("Selected occupation:", selectedOccupation);

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={containerRef}
        style={{
          height: "100vh",
          width: "100vw",
          background: "#fafafa",
          position: "relative",
        }}
      >
        {selectedOccupation && (
          <SideBar setSelectedOccupation={setSelectedOccupation}>
            <OccupationDetails
              selectedOccupation={selectedOccupation}
              setSelectedOccupation={setSelectedOccupation}
            />
          </SideBar>
        )}
      </div>

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
