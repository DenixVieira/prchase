import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { AppDataSource } from "../../config/data-source";
import { RefreshToken, User } from "../../database/entities";
import { env } from "../../config/env";

interface RefreshPayload {
  sub: string;
  jti: string;
}

export class TokenService {
  private refreshTokenRepo = AppDataSource.getRepository(RefreshToken);

  generateAccessToken(user: User): string {
    return jwt.sign({ sub: user.id }, env.jwt.secret, { expiresIn: env.jwt.expiresIn } as jwt.SignOptions);
  }

  async generateRefreshToken(user: User, ipAddress?: string): Promise<string> {
    const jti = randomUUID();
    const token = jwt.sign({ sub: user.id, jti }, env.jwt.refreshSecret, {
      expiresIn: env.jwt.refreshExpiresIn,
    } as jwt.SignOptions);

    const decoded = jwt.decode(token) as { exp: number };
    const tokenHash = await bcrypt.hash(jti, 10);

    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(decoded.exp * 1000),
        ipAddress: ipAddress ?? null,
      })
    );

    return token;
  }

  async rotateRefreshToken(oldToken: string, ipAddress?: string): Promise<{ userId: string; accessToken: string; refreshToken: string } | null> {
    let payload: RefreshPayload;
    try {
      payload = jwt.verify(oldToken, env.jwt.refreshSecret) as RefreshPayload;
    } catch {
      return null;
    }

    const candidates = await this.refreshTokenRepo.find({
      where: { userId: payload.sub, revoked: false },
      order: { createdAt: "DESC" },
      take: 20,
    });

    let matched: RefreshToken | undefined;
    for (const candidate of candidates) {
      if (await bcrypt.compare(payload.jti, candidate.tokenHash)) {
        matched = candidate;
        break;
      }
    }

    if (!matched || matched.expiresAt.getTime() < Date.now()) {
      return null;
    }

    matched.revoked = true;
    await this.refreshTokenRepo.save(matched);

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) return null;

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user, ipAddress);

    return { userId: user.id, accessToken, refreshToken };
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshTokenRepo.update({ userId, revoked: false }, { revoked: true });
  }
}
