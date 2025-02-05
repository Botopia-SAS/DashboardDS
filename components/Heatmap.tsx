import { useEffect, useRef } from "react";
import h337 from "heatmap.js";

interface HeatmapProps {
  data: { x: number; y: number; value: number }[];
}

const Heatmap: React.FC<HeatmapProps> = ({ data }) => {
  const heatmapRef = useRef<HTMLDivElement | null>(null);
  const heatmapInstance = useRef<h337.Heatmap<"value", "x", "y"> | null>(null);

  useEffect(() => {
    // Verifica si el contenedor existe
    if (!heatmapRef.current) {
      console.warn("🚨 heatmapRef.current es null");
      return;
    }

    const container = heatmapRef.current as HTMLElement;

    // Crear la instancia de Heatmap solo una vez cuando se monta el componente
    if (!heatmapInstance.current) {
      heatmapInstance.current = h337.create({
        container,
        radius: 20,
        maxOpacity: 0.6,
        minOpacity: 0.1,
        blur: 0.75,
      });
    }

    // Calcular el valor máximo de manera explícita y más eficiente
    const maxVal = data.length > 0 ? Math.max(...data.map((d) => d.value)) : 10;

    // Actualizar heatmap solo si hay datos
    if (data && data.length > 0) {
      heatmapInstance.current.setData({
        max: maxVal,
        min: 0,
        data,
      });
    } else {
      console.warn("🚨 No hay datos para el heatmap.");
    }

    // Limpiar la instancia del heatmap cuando el componente se desmonte
    return () => {
      if (heatmapInstance.current) {
        heatmapInstance.current = null;
      }
    };
  }, [data]);

  return <div ref={heatmapRef} className="w-full h-full bg-transparent relative" />;
};

export default Heatmap;
