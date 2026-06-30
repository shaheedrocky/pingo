import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "nativewind";
import { DarkTheme, LightTheme } from "../utils/theme";

type ThemeContextType = {
  mode: "light" | "dark";
  theme: typeof LightTheme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { colorScheme, setColorScheme } = useColorScheme();

  const mode = colorScheme === "dark" ? "dark" : "light";

  const theme = useMemo(
    () => (mode === "dark" ? DarkTheme : LightTheme),
    [mode]
  );

  const toggleTheme = () => {
    setColorScheme(mode === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
};