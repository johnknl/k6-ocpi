declare module "k6/x/jwt" {
  export function newHS256(secret: string, claims: Record<string, any>): string
}

