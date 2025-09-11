import { useEffect, useRef, useState } from "react";
import Graph from "graphology";
import { Sigma } from "sigma";
import forceAtlas2 from "graphology-layout-forceatlas2";
import SideBar from "../ui/SideBar";
import SkillDetails from "./SkillDetails";
import OccupationDetails from "./OccupationDetails";

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
  const graphRef = useRef(null);
  const nodesDataRef = useRef(null);
  const edgesDataRef = useRef(null);

  // State management for selected items
  const [selectedOccupation, setSelectedOccupation] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState(null);

  const state = {
    hoveredNode: "",
    hoveredNodeNeighbors: "",
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      if (sigmaInstanceRef.current) {
        sigmaInstanceRef.current.kill();
        sigmaInstanceRef.current = null;
      }

      // Fetch all nodes and edges as before
      const nodesRes = await fetch("http://127.0.0.1:8001/nodes").then((res) =>
        res.json()
      );
      const edgesRes = await fetch("http://127.0.0.1:8001/edges").then((res) =>
        res.json()
      );

      // Store data in refs for click handler access
      nodesDataRef.current = nodesRes;
      edgesDataRef.current = edgesRes;

      const graph = new Graph();
      graphRef.current = graph;

      // Filter group nodes by OCCUPATION_GROUPS
      const groupNodes = nodesRes.nodes.filter(
        (n) => n.type === "group" && OCCUPATION_GROUPS.includes(n.title)
      );
      const groupIds = new Set(groupNodes.map((n) => n.id));

      // Find all occupations connected to these groups
      const occEdges = edgesRes.edges.filter(
        (e) => e.type === "group_occupation" && groupIds.has(e.source)
      );
      const occupationIds = new Set(occEdges.map((e) => e.target));
      const occupationNodes = nodesRes.nodes.filter((n) =>
        occupationIds.has(n.id)
      );

      // Find all skills connected to these occupations
      const occSkillEdges = edgesRes.edges.filter(
        (e) => e.type === "occ_skill" && occupationIds.has(e.source)
      );
      const skillIds = new Set(occSkillEdges.map((e) => e.target));
      const skillNodes = nodesRes.nodes.filter((n) => skillIds.has(n.id));

      // Add occupation nodes
      const angleStep = (2 * Math.PI) / skillNodes.length;
      const radius = 500;
      occupationNodes.forEach((node, i) => {
        const angle = i * angleStep;
        graph.addNode(node.id, {
          label: node.title,
          type: "circle",
          customType: node.type,
          title: node.title, // Store original title
          x: 0 + radius * Math.cos(angle),
          y: 0 + radius * Math.sin(angle),
          size: 7,
          color: "#647FBC",
          labelColor: "#000",
        });
      });

      // Add skill nodes
      skillNodes.forEach((node, i) => {
        const angle = i * angleStep;
        graph.addNode(node.id, {
          label: node.title,
          labelColor: "#000",
          type: "circle",
          description: node.description,
          customType: node.type,
          title: node.title, // Store original title
          x: 0 + radius * Math.cos(angle),
          y: 0 + radius * Math.sin(angle),
          size: 5,
          color: "#DC143C",
        });
      });

      // Add occupation-skill edges
      occSkillEdges.forEach((edge) => {
        graph.addEdge(edge.source, edge.target, {
          type: "line",
          label: edge.type,
          color: "#3396D3",
          originalColor: "#91ADC8",
          size: 2.5,
        });
      });

      // Add skill-skill edges between selected skills
      edgesRes.edges
        .filter(
          (e) =>
            e.type === "skill_skill" &&
            skillIds.has(e.source) &&
            skillIds.has(e.target)
        )
        .forEach((edge) => {
          graph.addEdge(edge.source, edge.target, {
            type: "line",
            label: edge.type,
            color: "#A9A9A9",
            originalColor: "#F75270",
            size: 1.5,
          });
        });

      // Initialize Sigma
      if (containerRef.current && isMounted) {
        sigmaInstanceRef.current = new Sigma(graph, containerRef.current, {
          renderLabels: true,
          labelColor: { attribute: "labelColor" },
        });

        const sigmaRenderer = sigmaInstanceRef.current;

        // Hover functionality
        function setHoveredNode(node) {
          if (node) {
            state.hoveredNode = node;
            state.hoveredNodeNeighbors = new Set(graph.neighbors(node));
          }
          if (!node) {
            state.hoveredNode = undefined;
            state.hoveredNodeNeighbors = undefined;
          }
          sigmaRenderer.refresh({
            skipIndexation: true,
          });
        }

        // Hover events
        sigmaRenderer.on("enterNode", ({ node }) => {
          setHoveredNode(node);
        });
        sigmaRenderer.on("leaveNode", ({ node }) => {
          setHoveredNode(undefined);
        });

        // Click event handler
        sigmaRenderer.on("clickNode", ({ node }) => {
          const attrs = graph.getNodeAttributes(node);

          console.log("this ----------node aattrs-------------");
          console.log(attrs);

          if (attrs.customType === "occupation") {
            // Clear any skill selection when clicking occupation
            setSelectedSkill(null);
            setSelectedOccupation(attrs);
            setSelectedItemType("occupation");
            console.log("Selected occupation:", attrs);
          } else if (attrs.customType === "skill") {
            // Handle skill click

            console.log("this ----------node-------------");
            console.log(nodesDataRef.current.nodes);

            const skillOccEdges = edgesDataRef.current.edges
              .filter(
                (edge) => edge.type === "occ_skill" && edge.target === node
              )
              .map((el) => el.source);

            console.log(skillOccEdges);
            console.log("this -----------------------");

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
            console.log("Selected skill:", attrsWithOccupation);
          }
        });

        // Node and edge reducers for hover effects
        sigmaRenderer.setSetting("nodeReducer", (node, data) => {
          if (!data) console.log("data problems");
          const nodeData = { ...data };

          if (
            state.hoveredNode !== node &&
            state.hoveredNodeNeighbors &&
            !state.hoveredNodeNeighbors.has(node)
          ) {
            nodeData.label = "";
            nodeData.color = "#A9A9A9";
          } else {
            return nodeData;
          }

          return nodeData;
        });

        sigmaRenderer.setSetting("edgeReducer", (edge, data) => {
          const res = { ...data };

          if (state.hoveredNode) {
            const [source, target] = graph.extremities(edge);

            // Connected edges → restore originalColor
            if (source === state.hoveredNode || target === state.hoveredNode) {
              res.color = data.originalColor;
            } else {
              res.color = "#A9A9A9"; // unrelated edges gray out
            }
          } else {
            // No hover → reset to original color
            res.color = data.originalColor;
          }

          return res;
        });
      }

      const settings = {
        gravity: 0.1,
        scalingRatio: 20,
        slowDown: 10,
      };

      // Apply ForceAtlas2 layout
      forceAtlas2.assign(graph, { iterations: 49, settings });

      // Refresh Sigma to see the new layout
      sigmaInstanceRef.current.refresh();
    }

    fetchData();

    return () => {
      isMounted = false;
      if (sigmaInstanceRef.current) sigmaInstanceRef.current.kill();
    };
  }, []);

  // Clear selections function
  const clearSelections = () => {
    setSelectedOccupation(null);
    setSelectedSkill(null);
    setSelectedItemType(null);
  };

  return (
    <div
      style={{
        display: "flex",
        height: "90vh",
        position: "relative",
        overflow: "hidden", // Prevent scrollbars from causing layout shifts
      }}
    >
      {/* Graph Container */}
      <div
        ref={containerRef}
        style={{
          height: "100%",
          width: "100%",
          border: "2px #333",
          position: "relative", // Ensure proper positioning context
        }}
      />

      {/* Sidebar - positioned absolutely outside the graph container */}
      {(selectedOccupation || selectedSkill) && (
        <SideBar
          setSelectedOccupation={setSelectedOccupation}
          onClose={clearSelections}
        >
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
