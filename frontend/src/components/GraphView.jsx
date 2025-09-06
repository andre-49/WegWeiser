import { useEffect, useRef } from "react";
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

      // Add group nodes
      groupNodes.forEach((node) => {
        graph.addNode(node.id, {
          label: node.title,
          type: "circle",
          customType: node.type,
          x: Math.random() * 1000,
          y: Math.random() * 1000,
          size: 14,
          color: "#0074D9",
        });
      });

      // Add occupation nodes
      occupationNodes.forEach((node) => {
        graph.addNode(node.id, {
          label: node.title,
          type: "circle",
          customType: node.type,
          x: Math.random() * 1000,
          y: Math.random() * 1000,
          size: 10,
          color: "#2ECC40",
        });
      });

      // Add skill nodes
      skillNodes.forEach((node) => {
        graph.addNode(node.id, {
          label: node.title,
          type: "circle",
          customType: node.type,
          x: Math.random() * 1000,
          y: Math.random() * 1000,
          size: 7,
          color: "#FF4136",
        });
      });

      // Add group-occupation edges
      occEdges.forEach((edge) => {
        graph.addEdge(edge.source, edge.target, {
          type: "line",
          label: edge.type,
          color: "#0074D9",
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
        sigmaInstanceRef.current = new Sigma(graph, containerRef.current);
      }
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
        height: "1200px",
        width: "100vw",
        border: "2px solid #333",
        background: "#fafafa",
      }}
    />
  );
}

export default GraphView;
