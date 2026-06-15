import React, { useRef, useState, useEffect } from "react";
import { Badge, Button } from "@scp/ui";
import { Search, ZoomIn, ZoomOut, MapPin } from "lucide-react";

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onChange: (latitude: number, longitude: number) => void;
}

export function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(11);
  // Current view center, initialized to provided coordinates or a default (e.g., India)
  const [viewCenter, setViewCenter] = useState({ 
    lat: latitude || 21.0, 
    lng: longitude || 78.0 
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragAmount, setDragAmount] = useState(0);

  const tileSize = 256;
  const mapWidth = 400; // Expected rendered width (approx)
  const mapHeight = 240;

  function project(lat: number, lng: number) {
    const sin = Math.sin((lat * Math.PI) / 180);
    const scale = tileSize * 2 ** zoom;
    return {
      x: ((lng + 180) / 360) * scale,
      y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
    };
  }

  function unproject(x: number, y: number) {
    const scale = tileSize * 2 ** zoom;
    const lng = (x / scale) * 360 - 180;
    const n = Math.PI - (2 * Math.PI * y) / scale;
    const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
    return { latitude: lat, longitude: lng };
  }

  const center = project(viewCenter.lat, viewCenter.lng);
  const startX = center.x - mapWidth / 2;
  const startY = center.y - mapHeight / 2;
  
  const firstTileX = Math.floor(startX / tileSize);
  const firstTileY = Math.floor(startY / tileSize);
  const tileColumns = Math.ceil(mapWidth / tileSize) + 2;
  const tileRows = Math.ceil(mapHeight / tileSize) + 2;
  const worldTiles = 2 ** zoom;

  const tiles = Array.from({ length: tileColumns * tileRows }, (_, index) => {
    const column = index % tileColumns;
    const row = Math.floor(index / tileColumns);
    const rawX = firstTileX + column;
    const y = firstTileY + row;
    const x = ((rawX % worldTiles) + worldTiles) % worldTiles;
    return {
      key: `${zoom}-${x}-${y}`,
      left: rawX * tileSize - startX,
      top: y * tileSize - startY,
      url: `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`,
    };
  });

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragAmount(0);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    setDragAmount((prev) => prev + Math.abs(dx) + Math.abs(dy));

    const newCenterX = center.x - dx;
    const newCenterY = center.y - dy;
    const newLocation = unproject(newCenterX, newCenterY);
    
    setViewCenter({ lat: newLocation.latitude, lng: newLocation.longitude });
    setDragStart({ x: e.clientX, y: e.clientY });
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  function handleMapClick(e: React.MouseEvent<HTMLDivElement>) {
    if (dragAmount > 5) return; // Prevent click when dragging
    if (!mapRef.current) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const absoluteX = startX + clickX;
    const absoluteY = startY + clickY;

    const newLocation = unproject(absoluteX, absoluteY);
    onChange(
      Math.round(newLocation.latitude * 100000) / 100000,
      Math.round(newLocation.longitude * 100000) / 100000
    );
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        const newLat = parseFloat(result.lat);
        const newLng = parseFloat(result.lon);
        setViewCenter({ lat: newLat, lng: newLng });
        onChange(Math.round(newLat * 100000) / 100000, Math.round(newLng * 100000) / 100000);
        setZoom(13); // Zoom in on the found location
      } else {
        alert("Location not found. Please try a different query.");
      }
    } catch (err) {
      console.error("Geocoding failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  const markerPos = project(latitude || 0, longitude || 0);

  return (
    <div className="location-picker-wrap" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px" }}>
        <input 
          type="text" 
          placeholder="Search for a place (e.g. Mangaluru, India)" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--panel-subtle)", color: "var(--text)" }}
        />
        <Button disabled={isSearching} style={{ height: "auto" }}>
          <Search size={16} />
        </Button>
      </form>
      
      <div style={{ position: "relative" }}>
        <div 
          ref={mapRef}
          className="geo-tile-map" 
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleMapClick}
          style={{ 
            cursor: isDragging ? "grabbing" : "crosshair", 
            width: "100%", 
            height: `${mapHeight}px`, 
            position: "relative", 
            overflow: "hidden", 
            borderRadius: "6px",
            border: "1px solid var(--border-soft)",
            background: "#e0e0e0"
          }}
        >
          {tiles.map((tile) => (
            <img 
              key={tile.key} 
              src={tile.url} 
              alt="" 
              width={tileSize} 
              height={tileSize} 
              loading="lazy"
              style={{ position: "absolute", left: tile.left, top: tile.top, pointerEvents: "none" }} 
            />
          ))}
          {latitude !== 0 && longitude !== 0 && (
            <div
              className="map-marker blue"
              style={{
                position: "absolute",
                left: markerPos.x - startX,
                top: markerPos.y - startY,
                width: "16px",
                height: "16px",
                pointerEvents: "none",
                transform: "translate(-50%, -50%)",
                boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.3)",
                borderRadius: "50%",
                background: "var(--blue)",
                border: "2px solid white"
              }}
            />
          )}
        </div>
        
        {/* Zoom Controls */}
        <div style={{ position: "absolute", bottom: "10px", right: "10px", display: "flex", flexDirection: "column", gap: "4px", zIndex: 10 }}>
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); setZoom(Math.min(19, zoom + 1)); }}
            style={{ width: "32px", height: "32px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text)" }}
          >
            <ZoomIn size={16} />
          </button>
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); setZoom(Math.max(1, zoom - 1)); }}
            style={{ width: "32px", height: "32px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text)" }}
          >
            <ZoomOut size={16} />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <small style={{ color: "var(--text-soft)", display: "flex", alignItems: "center", gap: "6px" }}>
          <MapPin size={12} />
          Drag to pan. Click map to set pin.
        </small>
        <Badge tone="blue">Map Picker</Badge>
      </div>
    </div>
  );
}
