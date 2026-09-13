import app, { appReady } from '../backend/src/server.js';

export default async function handler(req: Parameters<typeof app>[0], res: Parameters<typeof app>[1]): Promise<void> {
	await appReady;
	app(req, res);
}