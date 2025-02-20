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
      {/* Meta Title */}
      <div>
        <label htmlFor="metaTitle" className="block text-sm font-medium">
          Meta Title
        </label>
        <input
          id="metaTitle"
          type="text"
          value={metaTitle || ""}
          onChange={(e) => {
            if (e.target.value !== metaTitle) setMetaTitle(e.target.value);
          }}
          placeholder="Enter meta title"
          aria-label="Meta Title"
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Meta Description */}
      <div>
        <label htmlFor="metaDescription" className="block text-sm font-medium">
          Meta Description
        </label>
        <input
          id="metaDescription"
          type="text"
          value={metaDescription || ""}
          onChange={(e) => {
            if (e.target.value !== metaDescription) setMetaDescription(e.target.value);
          }}
          placeholder="Enter meta description"
          aria-label="Meta Description"
          className="w-full p-2 border rounded"
        />
      </div>
    </div>
  );
}
