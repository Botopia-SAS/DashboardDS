interface OpenGraphFormProps {
  ogTitle: string;
  setOgTitle: (value: string) => void;
  ogImage: string;
  setOgImage: (value: string) => void;
}

export default function OpenGraphForm({
  ogTitle,
  setOgTitle,
  ogImage,
  setOgImage,
}: OpenGraphFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Open Graph Title</label>
        <input
          type="text"
          value={ogTitle}
          onChange={(e) => setOgTitle(e.target.value)}
          placeholder="Enter OG Title"
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">
          Open Graph Image URL
        </label>
        <input
          type="text"
          value={ogImage}
          onChange={(e) => setOgImage(e.target.value)}
          placeholder="Enter OG Image URL"
          className="w-full p-2 border rounded"
        />
      </div>
    </div>
  );
}
