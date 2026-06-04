import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette from QuestLock Brand & UI Structure PDF
        ql: {
          bighorn: "#22150C",
          night: "#432C1A",
          derby: "#5B4535",
          bear: "#816550",
          cafe: "#A98C75",
          chocolate: "#834A1F",
          ashen: "#D3CBC1",
        },
        background: "#D3CBC1",
        foreground: "#22150C",
        card: "#F5F1EC",
        muted: "#E7DED4",
        "muted-foreground": "#816550",
        border: "rgba(169, 140, 117, 0.45)",
        primary: "#22150C",
        "primary-foreground": "#F6F1EA",
        accent: "#834A1F",
        "accent-foreground": "#F6F1EA",
      },
      fontFamily: {
        serif: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "18px",
        button: "9999px",
      },
      boxShadow: {
        soft: "0 18px 50px rgba(34, 21, 12, 0.12)",
        card: "0 4px 24px rgba(34, 21, 12, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
