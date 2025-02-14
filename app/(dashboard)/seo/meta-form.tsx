interface MetaFormProps {
  metaTitle: string;
  setMetaTitle: (value: string) => void;
  metaDescription: string;
  setMetaDescription: (value: string) => void;
}

export default function MetaForm({
  metaTitle,
  setMetaTitle,
  metaDescription,
  setMetaDescription,
}: MetaFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Meta Title</label>
        <input
          type="text"
          value={metaTitle}
          onChange={(e) => setMetaTitle(e.target.value)}
          placeholder="Enter meta title"
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Meta Description</label>
        <input
          type="text"
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          placeholder="Enter meta description"
          className="w-full p-2 border rounded"
        />
      </div>
    </div>
  );
}
