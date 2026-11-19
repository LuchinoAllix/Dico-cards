export interface Colors {
  background: string; // screens
  surface: string; // cards, inputs, sheets
  text: string;
  textMuted: string;
  textFaint: string;
  border: string;
  primary: string; // accent text and icons
  button: string; // button backgrounds
  onButton: string; // text on buttons
  success: string;
  backdrop: string; // dim layer behind the modal
}

export const lightColors: Colors = {
  background: "#ffffff",
  surface: "#ffffff",
  text: "#111111",
  textMuted: "#666666",
  textFaint: "#888888",
  border: "#cccccc",
  primary: "#2563eb",
  button: "#2563eb",
  onButton: "#ffffff",
  success: "#16a34a",
  backdrop: "rgba(0,0,0,0.4)",
};

export const darkColors: Colors = {
  background: "#0f1117",
  surface: "#1a1d26",
  text: "#f9fafb",
  textMuted: "#9ca3af",
  textFaint: "#6b7280",
  border: "#303542",
  primary: "#3b82f6",
  button: "#3b82f6",
  onButton: "#ffffff",
  success: "#22c55e",
  backdrop: "rgba(0,0,0,0.7)",
};