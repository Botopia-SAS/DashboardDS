export default function RobotsForm({
  robotsTxt,
  setRobotsTxt,
}: {
  robotsTxt: string;
  setRobotsTxt: (value: string) => void;
}) {
  return (
    <div>
      {/* Label vinculado con el textarea */}
      <label htmlFor="robotsTxt" className="block text-sm font-medium">
        Robots.txt
      </label>
      
      {/* Textarea mejorado */}
      <textarea
        id="robotsTxt"
        className="w-full p-2 border rounded"
        value={robotsTxt || ""}
        onChange={(e) => {
          if (e.target.value !== robotsTxt) setRobotsTxt(e.target.value);
        }}
        placeholder="User-agent: *\nAllow: /"
        aria-label="Robots.txt settings"
        rows={4}
      />

      {/* Nota informativa */}
      <p className="text-xs text-gray-500">
        * Asegúrate de permitir la indexación de páginas clave.
      </p>
    </div>
  );
}
