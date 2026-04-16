"use client";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function ToggleSwitch({ checked, onChange, disabled = false }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 52,
        height: 28,
        borderRadius: 14,
        background: checked ? "#25D366" : "#555",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative",
        transition: "background 0.25s ease",
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: 3,
          left: checked ? 27 : 3,
          transition: "left 0.25s ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
      />
      <span
        style={{
          position: "absolute",
          top: 6,
          fontSize: "0.6rem",
          fontWeight: 700,
          color: "#fff",
          left: checked ? 6 : "auto",
          right: checked ? "auto" : 6,
          userSelect: "none",
        }}
      >
        {checked ? "ON" : "OFF"}
      </span>
    </button>
  );
}
