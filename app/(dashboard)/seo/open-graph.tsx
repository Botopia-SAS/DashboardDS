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
      {/* Open Graph Title */}
      <div>
        <label htmlFor="ogTitle" className="block text-sm font-medium">
          Open Graph Title
        </label>
        <input
          id="ogTitle"
          type="text"
          value={ogTitle || ""}
          onChange={(e) => {
            if (e.target.value !== ogTitle) setOgTitle(e.target.value);
          }}
          placeholder="Enter OG Title"
          aria-label="Open Graph Title"
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Open Graph Image URL */}
      <div>
        <label htmlFor="ogImage" className="block text-sm font-medium">
          Open Graph Image URL
        </label>
        <input
          id="ogImage"
          type="text"
          value={ogImage || ""}
          onChange={(e) => {
            if (e.target.value !== ogImage) setOgImage(e.target.value);
          }}
          placeholder="Enter OG Image URL"
          aria-label="Open Graph Image URL"
          className="w-full p-2 border rounded"
        />
      </div>
    </div>
  );
}
