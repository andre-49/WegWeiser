// Legend Component
export const Legend = ({ COLORS }) => (
  <div
    style={{
      position: "absolute",
      top: "20px",
      right: "20px",
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      border: "1px solid #333",
      borderRadius: "8px",
      padding: "16px",
      color: "#ffffff",
      fontSize: "14px",
      zIndex: 1000,
      minWidth: "180px",
      backdropFilter: "blur(10px)",
    }}
  >
    <div
      style={{
        fontWeight: "bold",
        marginBottom: "12px",
        fontSize: "16px",
        borderBottom: "1px solid #444",
        paddingBottom: "8px",
      }}
    >
      Legend
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            backgroundColor: COLORS.occupation,
            border: "1px solid #555",
          }}
        />
        <span>Occupations</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            backgroundColor: COLORS.skill,
            border: "1px solid #555",
          }}
        />
        <span>Skills</span>
      </div>

      <div
        style={{
          marginTop: "8px",
          paddingTop: "8px",
          borderTop: "1px solid #444",
          fontSize: "12px",
          color: "#ccc",
        }}
      >
        <div>• Click nodes for details</div>
        <div>• Hover to highlight connections</div>
      </div>
    </div>
  </div>
);
