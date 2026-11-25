export function isPostgresEnv(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  return url.startsWith("postgresql://") || url.startsWith("postgres://");
}

export function containsFilter(value: string) {
  if (isPostgresEnv()) {
    return { contains: value, mode: "insensitive" } as unknown as { contains: string };
  }
  return { contains: value };
}
