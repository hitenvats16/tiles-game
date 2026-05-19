import { toMeUser } from './user.js';

export function toAuthSession(user, token) {
  return {
    token,
    user: toMeUser(user),
  };
}
