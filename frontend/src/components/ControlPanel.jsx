// Control Panel Component
export const ControlPanel = ({ COLORS, resetView }) => (
  <div
    style={{
      position: "absolute",
      bottom: "21px",
      right: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      zIndex: 1000,
    }}
  >
    <button
      onClick={resetView}
      style={{
        padding: "10px 16px",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        border: "1px solid #333",
        borderRadius: "6px",
        color: "#ffffff",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "500",
        backdropFilter: "blur(10px)",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = "rgba(46, 204, 64, 0.2)";
        e.target.style.borderColor = COLORS.occupation;
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        e.target.style.borderColor = "#333";
      }}
    >
      🔄 Reset View
    </button>
  </div>
);
