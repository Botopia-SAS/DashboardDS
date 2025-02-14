interface RobotsFormProps {
  robotsTxt: string;
  setRobotsTxt: (value: string) => void;
}

export default function RobotsForm({
  robotsTxt,
  setRobotsTxt,
}: RobotsFormProps) {
  return (
    <div>
      <label className="block text-sm font-medium">Robots.txt</label>
      <textarea
        className="w-full p-2 border rounded"
        value={robotsTxt}
        onChange={(e) => setRobotsTxt(e.target.value)}
        rows={4}
      />
    </div>
  );
}
