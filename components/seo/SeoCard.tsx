interface SeoCardProps {
  title: string;
  description: string;
  value: string;
}

export default function SeoCard({ title, description, value }: SeoCardProps) {
  return (
    <div className="border p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
      <p className="mt-2 text-md font-semibold">{value}</p>
    </div>
  );
}
