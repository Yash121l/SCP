import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Monitor, Moon, Sun, ArrowRight, Laptop } from "lucide-react";
import type { SearchResult } from "@scp/contracts";
import { Badge } from "@scp/ui";
import { useCommandPalette } from "./command-palette-context.js";
import { apiGet } from "../../lib/api.js";
import { useAuth } from "../../features/auth/auth-context.js";

const searchTypeLabel: Record<SearchResult["type"], string> = {
  approval: "approval",
  curriculum: "curriculum",
  employee: "employee",
  hub: "incubator",
  institution: "school",
  project: "project",
  student: "student",
};

export function CommandPalette() {
  const { isOpen, setIsOpen } = useCommandPalette();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Define static routes for navigation when query is empty or short
  const staticRoutes = [
    { title: "Dashboard", path: "/workspace/dashboard" },
    { title: "Updates Inbox", path: "/workspace/updates" },
    { title: "Incubators", path: "/workspace/hubs" },
    { title: "Schools", path: "/workspace/institutions" },
    { title: "Projects", path: "/workspace/projects" },
    { title: "Students", path: "/workspace/students" },
    { title: "Governance", path: "/workspace/governance" },
  ].filter(route => 
    query.length > 0 ? route.title.toLowerCase().includes(query.toLowerCase()) : true
  );

  const displayResults = query.length > 1 ? results : [];
  const totalItems = displayResults.length > 0 ? displayResults.length : staticRoutes.length;

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % totalItems);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (totalItems === 0) return;
        
        if (displayResults.length > 0) {
          const result = displayResults[selectedIndex];
          if (result) handleSelect(result);
        } else if (staticRoutes.length > 0) {
          const route = staticRoutes[selectedIndex];
          if (route) handleRouteSelect(route.path);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, totalItems, displayResults, staticRoutes, selectedIndex, setIsOpen]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      void apiGet<{ results: SearchResult[] }>(
        `/api/search?q=${encodeURIComponent(query.trim())}`,
        session?.token,
      )
        .then((payload) => {
          setResults(payload.results);
          setSelectedIndex(0);
        })
        .catch(() => setResults([]));
    }, 180);

    return () => window.clearTimeout(handle);
  }, [query, session?.token]);

  function handleSelect(result: SearchResult) {
    setIsOpen(false);
    navigate(result.path);
  }

  function handleRouteSelect(path: string) {
    setIsOpen(false);
    navigate(path);
  }

  function handleThemeChange(theme: "light" | "dark" | "system") {
    if (theme === "system") {
      delete document.documentElement.dataset.theme;
      localStorage.removeItem("theme");
    } else {
      document.documentElement.dataset.theme = theme;
      localStorage.setItem("theme", theme);
    }
    setIsOpen(false);
  }

  if (!isOpen) return null;

  return (
    <div className="sheet-overlay" style={{ pointerEvents: "auto", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "12vh" }}>
      <button className="sheet-scrim" onClick={() => setIsOpen(false)} aria-label="Close menu" />
      
      <div 
        className="command-palette-modal"
        role="dialog"
        aria-label="Command Palette"
        style={{
          background: "var(--panel)",
          border: "1px solid var(--border-soft)",
          borderRadius: "12px",
          boxShadow: "0 16px 64px rgba(0, 0, 0, 0.24)",
          display: "flex",
          flexDirection: "column",
          maxWidth: "540px",
          position: "relative",
          width: "calc(100vw - 32px)",
          zIndex: 100,
          overflow: "hidden"
        }}
      >
        <div style={{
          alignItems: "center",
          borderBottom: "1px solid var(--border-soft)",
          display: "flex",
          padding: "16px",
          gap: "12px"
        }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            ref={inputRef}
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              background: "transparent",
              border: 0,
              color: "var(--text)",
              flex: 1,
              fontSize: "15px",
              outline: "none"
            }}
          />
          <Badge tone="neutral" style={{ fontSize: "10px" }}>ESC</Badge>
        </div>

        <div style={{ maxHeight: "340px", overflowY: "auto", padding: "8px" }}>
          {query.length > 1 && displayResults.length === 0 ? (
            <div style={{ color: "var(--text-muted)", padding: "24px", textAlign: "center", fontSize: "13px" }}>
              No results found for "{query}"
            </div>
          ) : query.length > 1 ? (
            <div className="search-results-group">
              <div style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, padding: "8px", textTransform: "uppercase" }}>
                Records
              </div>
              {displayResults.map((result, i) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  style={{
                    alignItems: "center",
                    background: i === selectedIndex ? "var(--panel-subtle)" : "transparent",
                    border: 0,
                    borderRadius: "6px",
                    color: "var(--text)",
                    display: "flex",
                    gap: "12px",
                    padding: "10px 12px",
                    textAlign: "left",
                    width: "100%",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 650, fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {result.label}
                    </div>
                    <div style={{ color: "var(--text-soft)", fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {result.meta}
                    </div>
                  </div>
                  <Badge tone="blue">{searchTypeLabel[result.type]}</Badge>
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="search-results-group" style={{ marginBottom: "8px" }}>
                <div style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, padding: "8px", textTransform: "uppercase" }}>
                  Navigation
                </div>
                {staticRoutes.map((route, i) => (
                  <button
                    key={route.path}
                    onClick={() => handleRouteSelect(route.path)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    style={{
                      alignItems: "center",
                      background: i === selectedIndex ? "var(--panel-subtle)" : "transparent",
                      border: 0,
                      borderRadius: "6px",
                      color: "var(--text)",
                      display: "flex",
                      gap: "10px",
                      padding: "10px 12px",
                      textAlign: "left",
                      width: "100%",
                      cursor: "pointer"
                    }}
                  >
                    <ArrowRight size={14} color="var(--text-soft)" />
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>{route.title}</span>
                  </button>
                ))}
              </div>

              <div className="search-results-group">
                <div style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, padding: "8px", textTransform: "uppercase" }}>
                  Theme
                </div>
                <button
                  onClick={() => handleThemeChange("light")}
                  style={{
                    alignItems: "center",
                    background: "transparent",
                    border: 0,
                    borderRadius: "6px",
                    color: "var(--text)",
                    display: "flex",
                    gap: "10px",
                    padding: "10px 12px",
                    textAlign: "left",
                    width: "100%",
                    cursor: "pointer"
                  }}
                >
                  <Sun size={14} color="var(--text-soft)" />
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>Light mode</span>
                </button>
                <button
                  onClick={() => handleThemeChange("dark")}
                  style={{
                    alignItems: "center",
                    background: "transparent",
                    border: 0,
                    borderRadius: "6px",
                    color: "var(--text)",
                    display: "flex",
                    gap: "10px",
                    padding: "10px 12px",
                    textAlign: "left",
                    width: "100%",
                    cursor: "pointer"
                  }}
                >
                  <Moon size={14} color="var(--text-soft)" />
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>Dark mode</span>
                </button>
                <button
                  onClick={() => handleThemeChange("system")}
                  style={{
                    alignItems: "center",
                    background: "transparent",
                    border: 0,
                    borderRadius: "6px",
                    color: "var(--text)",
                    display: "flex",
                    gap: "10px",
                    padding: "10px 12px",
                    textAlign: "left",
                    width: "100%",
                    cursor: "pointer"
                  }}
                >
                  <Monitor size={14} color="var(--text-soft)" />
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>System default</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
