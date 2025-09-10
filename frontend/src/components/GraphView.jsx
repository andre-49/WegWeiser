import { useEffect, useRef } from "react";
import Graph from "graphology";
import { Sigma } from "sigma";
import forceAtlas2 from "graphology-layout-forceatlas2";

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

      const graph = new Graph();

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
          // x: Math.random() * 3000,
          // y: Math.random() * 3000,
          x: 0 + radius * Math.cos(angle),
          y: 0 + radius * Math.sin(angle),
          size: 10,
          color: "#2ECC40",
          labelColor: "#ffffff",
        });
      });

      // Add skill nodes
      skillNodes.forEach((node, i) => {
        const angle = i * angleStep;
        graph.addNode(node.id, {
          label: node.title,
          labelColor: "#ffffff",
          type: "circle",
          customType: node.type,
          x: 0 + radius * Math.cos(angle),
          y: 0 + radius * Math.sin(angle),
          size: 7,
          color: "#FF4136",
        });
      });

      // Add occupation-skill edges
      occSkillEdges.forEach((edge) => {
        graph.addEdge(edge.source, edge.target, {
          type: "line",
          label: edge.type,
          color: "#2ECC40",
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
            color: "#FF4136",
          });
        });

      // Initialize Sigma
      if (containerRef.current && isMounted) {
        sigmaInstanceRef.current = new Sigma(graph, containerRef.current, {
          renderLabels: true,
          labelColor: { attribute: "labelColor" },
        });
        //made an instance to get events
        const sigmaRenderer = sigmaInstanceRef.current;
        //Defining the sethovered function
        function setHoveredNode(node) {
          if (node) {
            state.hoveredNode = node;
            state.hoveredNodeNeighbors = new Set(graph.neighbors(node));
            // console.log(state.hoveredNodeNeighbors);
          }
          if (!node) {
            state.hoveredNode = undefined;
            state.hoveredNodeNeighbors = undefined;
          }
          // Refresh rendering
          sigmaRenderer.refresh({
            // We don't touch the graph data so we can skip its reindexation
            skipIndexation: true,
          });
        }
        //Calling the on function/method
        sigmaRenderer.on("enterNode", ({ node }) => {
          setHoveredNode(node);
        });
        sigmaRenderer.on("leaveNode", ({ node }) => {
          setHoveredNode(undefined);
        });
        //use the SetSetting method

        sigmaRenderer.setSetting("nodeReducer", (node, data) => {
          if (!data) console.log("data problems");
          const nodeData = { ...data };

          if (
            state.hoveredNode !== node &&
            state.hoveredNodeNeighbors &&
            !state.hoveredNodeNeighbors.has(node)
          ) {
            nodeData.label = "";
            nodeData.color = "#a9a9a9";
          } else {
            return nodeData;

            // console.log(nodeData);
          }
          return nodeData;
        });

        sigmaRenderer.setSetting("edgeReducer", (edge, data) => {
          const res = { ...data };
          if (
            state.hoveredNode &&
            !graph
              .extremities(edge)
              .every(
                (n) =>
                  n === state.hoveredNode ||
                  graph.areNeighbors(n, state.hoveredNode)
              )
          ) {
            res.hidden = true;
          }
          return res;
        });

        // sigmaRenderer.setSetting("nodeReducer",(node,data)=>{
        //   const nodeData = {...data}
        //   if (state.hoveredNodeNeighbors&&state.hoveredNodeNeighbors.h) {

        //   }
        // })
      }
      const settings = {
        gravity: 10,
        scalingRatio: 20,
        slowDown: 10,
      };

      // Apply ForceAtlas2 layout
      forceAtlas2.assign(graph, { iterations: 100, settings });

      // Refresh Sigma to see the new layout
      sigmaInstanceRef.current.refresh();
    }

    fetchData();

    return () => {
      isMounted = false;
      if (sigmaInstanceRef.current) sigmaInstanceRef.current.kill();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        height: "85vh",
        width: "100vw",
        border: "2px solid #333",
      }}
    />
  );
}

export default GraphView;
