export default function RobotsForm({
  robotsTxt,
  setRobotsTxt,
}: {
  robotsTxt: string;
  setRobotsTxt: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium">Robots.txt</label>
      <textarea
        className="w-full p-2 border rounded"
        value={robotsTxt}
        onChange={(e) => setRobotsTxt(e.target.value)}
        placeholder={`User-agent: *\nAllow: /`}
        rows={4}
      />
      <p className="text-xs text-gray-500">
        * Asegúrate de permitir la indexación de páginas clave.
      </p>
    </div>
  );
}
