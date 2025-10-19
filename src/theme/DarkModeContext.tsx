"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useLayoutEffect,
} from "react";

// Definindo a interface para o contexto
interface DarkModeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

// Criando o contexto com o tipo DarkModeContextType ou null
const DarkModeContext = createContext<DarkModeContextType | null>(null);

interface DarkModeProviderProps {
  children: ReactNode;
}

export const DarkModeProvider = ({ children }: DarkModeProviderProps) => {
  const [darkMode, setDarkMode] = useState(false);

  // Definir a classe inicial e atualizar darkMode a partir de localStorage
  useLayoutEffect(() => {
    const savedMode = localStorage.getItem("darkMode");
    const initialMode = savedMode ? JSON.parse(savedMode) : false;
    setDarkMode(initialMode);
    document.documentElement.classList.toggle("dark", initialMode);
  }, []);

  // Atualizar o localStorage e a classe do modo dark
  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

// Hook para consumir o contexto com tipagem correta
export const useDarkMode = (): DarkModeContextType => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error("useDarkMode must be used within a DarkModeProvider");
  }
  return context;
};
