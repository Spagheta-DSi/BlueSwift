// src/api.ts
import { AtpAgent } from '@atproto/api';

export const agent = new AtpAgent({
	service: "https://api.bsky.app",
});

export const authAgent = new AtpAgent({
	service: "https://bsky.social",
});