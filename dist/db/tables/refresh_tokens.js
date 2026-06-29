export const insertRefreshTokenSQL = `
    INSERT INTO refresh_tokens (user_id, token, expires_at)
    VALUES ($1, $2, $3)
    RETURNING id, user_id, expires_at, created_at;
`;
export const getRefreshTokenByHashedTokenSQL = `
    SELECT id, user_id, token, expires_at, created_at, revoked_at
    FROM refresh_tokens
    WHERE token = $1;
`;
export const revokeRefreshTokenSQL = `
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE token = $1 AND revoked_at IS NULL;
`;
export const revokeAllUserRefreshTokensSQL = `
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE user_id = $1 AND revoked_at IS NULL;
`;
