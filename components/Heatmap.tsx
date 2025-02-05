import { useEffect, useRef } from "react";
import h337 from "heatmap.js";

interface HeatmapProps {
  data: { x: number; y: number; value: number }[];
}

const Heatmap: React.FC<HeatmapProps> = ({ data }) => {
  const heatmapRef = useRef<HTMLDivElement | null>(null);
  const heatmapInstance = useRef<h337.Heatmap<"value", "x", "y"> | null>(null);

  useEffect(() => {  
    if (!heatmapRef.current) {
      console.warn("🚨 heatmapRef.current es null");
      return;
    }
  
    const container = heatmapRef.current as HTMLElement;
    if (!container) {
      console.warn("🚨 Contenedor no encontrado");
      return;
    }
  
    if (!data || data.length === 0) {
      console.warn("🚨 No hay datos para el heatmap, esperando actualización...");
      return;
    }
  
    // Crear la instancia solo cuando hay datos
    if (!heatmapInstance.current) {
      heatmapInstance.current = h337.create({
        container,
        radius: 20,
        maxOpacity: 0.6,
        minOpacity: 0.1,
        blur: 0.75,
      });
    }
  
    // Calcular el `max` dinámicamente
    const maxVal = Math.max(...data.map((d) => d.value), 10);
  
    // Actualizar heatmap
    heatmapInstance.current.setData({
      max: maxVal,
      min: 0,
      data,
    });
  }, [data]);  

  return <div ref={heatmapRef} className="w-full h-[500px] bg-gray-200 relative" />;
};

export default Heatmap;
