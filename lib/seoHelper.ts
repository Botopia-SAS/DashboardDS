export function validateMetaTitle(title: string) {
  return title.length > 0 && title.length <= 60;
}

export function validateMetaDescription(description: string) {
  return description.length > 0 && description.length <= 160;
}

export function formatRobotsTxt(robotsTxt: string) {
  return robotsTxt.trim();
}

export function validateSlug(slug: string) {
  // El slug debe contener solo letras minúsculas, números y guiones
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugPattern.test(slug);
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Eliminar caracteres especiales excepto espacios y guiones
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/--+/g, '-') // Reemplazar múltiples guiones con uno solo
    .replace(/^-+/, '') // Eliminar guiones al inicio
    .replace(/-+$/, ''); // Eliminar guiones al final
}
