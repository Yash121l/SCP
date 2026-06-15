import React, { useState, useEffect, useRef } from "react";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onLocationFound?: (lat: number, lng: number) => void;
  placeholder?: string;
  required?: boolean;
}

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
}

export function AddressAutocomplete({ value, onChange, onLocationFound, placeholder, required }: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync internal query with external value when it changes from outside
  useEffect(() => {
    if (value !== query && !isOpen) {
      setQuery(value || "");
    }
  }, [value, isOpen, query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query || query.length < 3 || !isOpen) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
          {
            headers: {
              "Accept-Language": "en"
            }
          }
        );
        const data = await response.json() as NominatimResult[];
        setResults(data);
      } catch (error) {
        console.error("Failed to fetch address suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceId = setTimeout(fetchResults, 500);
    return () => clearTimeout(debounceId);
  }, [query, isOpen]);

  const handleSelect = (result: NominatimResult) => {
    setQuery(result.display_name);
    onChange(result.display_name);
    if (onLocationFound) {
      onLocationFound(Number(result.lat), Number(result.lon));
    }
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: "100%" }}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder || "Search for an address..."}
        required={required}
        autoComplete="off"
      />
      {isOpen && query.length >= 3 && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            zIndex: 50,
            maxHeight: "240px",
            overflowY: "auto",
            listStyle: "none",
            margin: 0,
            padding: "4px",
          }}
        >
          {isLoading && <li style={{ padding: "8px 12px", color: "var(--text-soft)", fontSize: "13px" }}>Loading...</li>}
          {!isLoading && results.length === 0 && (
            <li style={{ padding: "8px 12px", color: "var(--text-soft)", fontSize: "13px" }}>No results found</li>
          )}
          {!isLoading &&
            results.map((result) => (
              <li
                key={result.place_id}
                onClick={() => handleSelect(result)}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontSize: "13px",
                  borderRadius: "4px",
                  color: "var(--text)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--panel-subtle)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {result.display_name}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
