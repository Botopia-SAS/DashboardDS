export function validateMetaTitle(title: string) {
  return title.length > 0 && title.length <= 60;
}

export function validateMetaDescription(description: string) {
  return description.length > 0 && description.length <= 160;
}

export function formatRobotsTxt(robotsTxt: string) {
  return robotsTxt.trim();
}
