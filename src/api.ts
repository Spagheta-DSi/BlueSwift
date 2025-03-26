// src/api.ts
import { BskyAgent } from '@atproto/api';

export const agent = new BskyAgent({
	service: "https://api.bsky.app",
});

export const authAgent = new BskyAgent({
	service: "https://bsky.social",
});