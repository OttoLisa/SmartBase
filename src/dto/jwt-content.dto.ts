export class JwtContentDto {
  sub: string;
  displayName: string;
  roles: string[];
  iat: number;
  exp: number;
}
