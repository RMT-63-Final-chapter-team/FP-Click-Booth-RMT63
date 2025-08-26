export const TOKEN_PACKAGES = {
  basic: { price: 20000, tokens: 10 },
  pro: { price: 55000, tokens: 30 },
  premium: { price: 90000, tokens: 50 },
} as const;

export type PackageName = keyof typeof TOKEN_PACKAGES;

export function resolvePackage(pkg?: string) {
  if (pkg === "basic" || pkg === "pro" || pkg === "premium") return pkg;
  return "basic" as const; // default aman
}
