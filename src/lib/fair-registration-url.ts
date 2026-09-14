export function getFairRegistrationUrl(baseUrl: string, industrySlug: string, email: string) {
  const url = new URL("/registrace", baseUrl);
  url.searchParams.set("source", "veletrh");
  url.searchParams.set("industry", industrySlug);
  url.searchParams.set("email", email.trim().toLowerCase());
  return url.toString();
}
