import { useEffect, useRef, useState, useCallback } from "react";
import Graph from "graphology";
import { Sigma } from "sigma";
import forceAtlas2 from "graphology-layout-forceatlas2";
import SideBar from "../ui/SideBar";
import SkillDetails from "./SkillDetails";
import OccupationDetails from "./OccupationDetails";
import { ControlPanel } from "./ControlPanel";
import { Legend } from "./Legend";

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

// Constants for better maintainability
const COLORS = {
  occupation: "#2ECC40",
  skill: "#FF4136",
  hover: "#a9a9a9",
  text: "#ffffff",
};

const SIZES = {
  occupation: 10,
  skill: 7,
};

const API_BASE_URL = "http://127.0.0.1:8001";

function GraphView() {
  const containerRef = useRef(null);
  const sigmaInstanceRef = useRef(null);
  const graphRef = useRef(null);
  const nodesDataRef = useRef(null);
  const edgesDataRef = useRef(null);

  // State management
  const [selectedOccupation, setSelectedOccupation] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hover state using useRef for performance
  const hoverState = useRef({
    hoveredNode: null,
    hoveredNodeNeighbors: null,
  });

  // Memoized API calls
  const fetchGraphData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [nodesRes, edgesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/nodes`).then((res) => {
          if (!res.ok) throw new Error("Failed to fetch nodes");
          return res.json();
        }),
        fetch(`${API_BASE_URL}/edges`).then((res) => {
          if (!res.ok) throw new Error("Failed to fetch edges");
          return res.json();
        }),
      ]);

      return { nodes: nodesRes, edges: edgesRes };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Memoized data processing
  const processGraphData = useCallback(({ nodes, edges }) => {
    // Filter group nodes by OCCUPATION_GROUPS
    const groupNodes = nodes.nodes.filter(
      (n) => n.type === "group" && OCCUPATION_GROUPS.includes(n.title)
    );
    const groupIds = new Set(groupNodes.map((n) => n.id));

    // Find connected occupations and skills
    const occEdges = edges.edges.filter(
      (e) => e.type === "group_occupation" && groupIds.has(e.source)
    );
    const occupationIds = new Set(occEdges.map((e) => e.target));
    const occupationNodes = nodes.nodes.filter((n) => occupationIds.has(n.id));

    const occSkillEdges = edges.edges.filter(
      (e) => e.type === "occ_skill" && occupationIds.has(e.source)
    );
    const skillIds = new Set(occSkillEdges.map((e) => e.target));
    const skillNodes = nodes.nodes.filter((n) => skillIds.has(n.id));

    // Get skill-skill edges
    const skillSkillEdges = edges.edges.filter(
      (e) =>
        e.type === "skill_skill" &&
        skillIds.has(e.source) &&
        skillIds.has(e.target)
    );

    return {
      occupationNodes,
      skillNodes,
      occSkillEdges,
      skillSkillEdges,
    };
  }, []);

  // Create graph nodes with circular layout
  const createGraph = useCallback((processedData) => {
    const graph = new Graph();
    const { occupationNodes, skillNodes, occSkillEdges, skillSkillEdges } =
      processedData;

    const totalNodes = occupationNodes.length + skillNodes.length;
    const angleStep = (2 * Math.PI) / Math.max(totalNodes, 1);
    const radius = Math.max(300, totalNodes * 8); // Dynamic radius based on node count

    // Add occupation nodes
    occupationNodes.forEach((node, i) => {
      const angle = i * angleStep;
      graph.addNode(node.id, {
        label: node.title,
        type: "circle",
        customType: node.type,
        title: node.title,
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
        size: SIZES.occupation,
        color: COLORS.occupation,
        labelColor: COLORS.text,
      });
    });

    // Add skill nodes
    skillNodes.forEach((node, i) => {
      const angle = (i + occupationNodes.length) * angleStep;
      graph.addNode(node.id, {
        label: node.title,
        labelColor: COLORS.text,
        type: "circle",
        description: node.description,
        customType: node.type,
        title: node.title,
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
        size: SIZES.skill,
        color: COLORS.skill,
      });
    });

    // Add edges
    [...occSkillEdges, ...skillSkillEdges].forEach((edge) => {
      graph.addEdge(edge.source, edge.target, {
        type: "line",
        label: edge.type,
        color: edge.type === "occ_skill" ? COLORS.occupation : COLORS.skill,
        size: 1,
      });
    });

    return graph;
  }, []);

  // Hover functionality
  const setHoveredNode = useCallback((node) => {
    const graph = graphRef.current;
    const sigma = sigmaInstanceRef.current;

    if (!graph || !sigma) return;

    if (node) {
      hoverState.current.hoveredNode = node;
      hoverState.current.hoveredNodeNeighbors = new Set(graph.neighbors(node));
    } else {
      hoverState.current.hoveredNode = null;
      hoverState.current.hoveredNodeNeighbors = null;
    }

    sigma.refresh({ skipIndexation: true });
  }, []);

  // Click handler for nodes
  const handleNodeClick = useCallback(({ node }) => {
    const graph = graphRef.current;
    const attrs = graph.getNodeAttributes(node);

    if (attrs.customType === "occupation") {
      setSelectedSkill(null);
      setSelectedOccupation(attrs);
      setSelectedItemType("occupation");
    } else if (attrs.customType === "skill") {
      const skillOccEdges = edgesDataRef.current.edges
        .filter((edge) => edge.type === "occ_skill" && edge.target === node)
        .map((el) => el.source);

      const occupationNodes = nodesDataRef.current.nodes.filter(
        (n) => n.type === "occupation"
      );

      const occupationLinkedWithSelectedSkills = occupationNodes
        .filter((occ) => skillOccEdges.includes(occ.id))
        .map((el) => el.title);

      const attrsWithOccupation = {
        ...attrs,
        occupation: [...new Set(occupationLinkedWithSelectedSkills)],
      };

      setSelectedOccupation(null);
      setSelectedSkill(attrsWithOccupation);
      setSelectedItemType("skill");
    }
  }, []);

  // Node reducer for hover effects
  const nodeReducer = useCallback((node, data) => {
    const nodeData = { ...data };
    const { hoveredNode, hoveredNodeNeighbors } = hoverState.current;

    if (
      hoveredNode &&
      hoveredNode !== node &&
      hoveredNodeNeighbors &&
      !hoveredNodeNeighbors.has(node)
    ) {
      nodeData.label = "";
      nodeData.color = COLORS.hover;
    }

    return nodeData;
  }, []);

  // Edge reducer for hover effects
  const edgeReducer = useCallback((edge, data) => {
    const res = { ...data };
    const graph = graphRef.current;
    const { hoveredNode } = hoverState.current;

    if (hoveredNode && graph) {
      const extremities = graph.extremities(edge);
      const shouldShow = extremities.every(
        (n) => n === hoveredNode || graph.areNeighbors(n, hoveredNode)
      );
      if (!shouldShow) {
        res.hidden = true;
      }
    }

    return res;
  }, []);

  // Initialize Sigma instance
  const initializeSigma = useCallback(
    (graph) => {
      if (!containerRef.current || sigmaInstanceRef.current) return;

      const sigma = new Sigma(graph, containerRef.current, {
        renderLabels: true,
        labelColor: { attribute: "labelColor" },
        defaultNodeColor: COLORS.skill,
        defaultEdgeColor: "#ccc",
      });

      // Set up event listeners
      sigma.on("enterNode", ({ node }) => setHoveredNode(node));
      sigma.on("leaveNode", () => setHoveredNode(null));
      sigma.on("clickNode", handleNodeClick);

      // Set up reducers
      sigma.setSetting("nodeReducer", nodeReducer);
      sigma.setSetting("edgeReducer", edgeReducer);

      sigmaInstanceRef.current = sigma;
      return sigma;
    },
    [setHoveredNode, handleNodeClick, nodeReducer, edgeReducer]
  );

  // Main effect for graph initialization
  useEffect(() => {
    let isMounted = true;

    const initializeGraph = async () => {
      try {
        // Cleanup existing instance
        if (sigmaInstanceRef.current) {
          sigmaInstanceRef.current.kill();
          sigmaInstanceRef.current = null;
        }

        const data = await fetchGraphData();
        if (!isMounted) return;

        // Store data for click handlers
        nodesDataRef.current = data.nodes;
        edgesDataRef.current = data.edges;

        const processedData = processGraphData(data);
        const graph = createGraph(processedData);

        graphRef.current = graph;

        // Apply layout
        const layoutSettings = {
          gravity: 10,
          scalingRatio: 20,
          slowDown: 10,
        };

        forceAtlas2.assign(graph, {
          iterations: 100,
          settings: layoutSettings,
        });

        // Initialize Sigma
        const sigma = initializeSigma(graph);
        if (sigma) {
          sigma.refresh();
        }
      } catch (err) {
        console.error("Error initializing graph:", err);
        if (isMounted) {
          setError("Failed to load graph data");
        }
      }
    };

    initializeGraph();

    return () => {
      isMounted = false;
      if (sigmaInstanceRef.current) {
        sigmaInstanceRef.current.kill();
        sigmaInstanceRef.current = null;
      }
    };
  }, [fetchGraphData, processGraphData, createGraph, initializeSigma]);

  // Clear selections
  const clearSelections = useCallback(() => {
    setSelectedOccupation(null);
    setSelectedSkill(null);
    setSelectedItemType(null);
  }, []);

  // Reset view function
  const resetView = useCallback(() => {
    const sigma = sigmaInstanceRef.current;
    if (sigma) {
      sigma.getCamera().animate({ x: 0, y: 0, ratio: 1 }, { duration: 500 });
    }
    clearSelections();
  }, [clearSelections]);

  // Error state
  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "85vh",
          color: "#ff4444",
          fontSize: "18px",
        }}
      >
        Error: {error}
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "85vh",
          fontSize: "18px",
        }}
      >
        Loading graph data...
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        height: "85vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Graph Container */}
      <div
        ref={containerRef}
        style={{
          height: "100%",
          width: "100%",
          border: "2px solid #333",
          position: "relative",
          backgroundColor: "#1a1a1a", // Dark background for better contrast
        }}
      />

      {/* Legend */}
      <Legend COLORS={COLORS} />

      {/* Control Panel */}
      <ControlPanel COLORS={COLORS} resetView={resetView} />

      {/* Sidebar */}
      {(selectedOccupation || selectedSkill) && (
        <SideBar onClose={clearSelections}>
          {selectedItemType === "occupation" && selectedOccupation && (
            <OccupationDetails
              selectedOccupation={selectedOccupation}
              setSelectedOccupation={setSelectedOccupation}
              onClose={clearSelections}
            />
          )}
          {selectedItemType === "skill" && selectedSkill && (
            <SkillDetails
              selectedSkill={selectedSkill}
              onClose={clearSelections}
            />
          )}
        </SideBar>
      )}
    </div>
  );
}

export default GraphView;
