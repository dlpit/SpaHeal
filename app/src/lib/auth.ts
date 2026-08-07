import { SignJWT, jwtVerify } from 'jose';

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length === 0) {
    return 'spa_heal_default_fallback_jwt_secret_key_2026';
  }
  return secret;
};

export const verifyToken = async (token: string) => {
  try {
    const verified = await jwtVerify(
      token,
      new TextEncoder().encode(getJwtSecretKey())
    );
    return verified.payload;
  } catch (error) {
    return null;
  }
};

export const signToken = async (payload: { username: string; role: string }) => {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 24 * 7; // 7 days

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime(exp)
    .setIssuedAt(iat)
    .setNotBefore(iat)
    .sign(new TextEncoder().encode(getJwtSecretKey()));
};
