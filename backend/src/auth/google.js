import { OAuth2Client } from 'google-auth-library';
import { config } from '../config.js';

const googleClient = new OAuth2Client(config.auth.googleClientId);

const GMAIL_SUFFIX = /@gmail\.com$/i;

export async function verifyGoogleCredential(credential) {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: config.auth.googleClientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.email) return null;

  const email = payload.email.toLowerCase();
  const username = email.replace(GMAIL_SUFFIX, '').split('@')[0];
  return {
    email,
    username,
    avatarUrl: payload.picture || null,
  };
}
