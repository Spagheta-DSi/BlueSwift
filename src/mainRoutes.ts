// src/mainRouter.ts
import express, { Request, Response } from 'express';
import { agent } from './api';
import * as util from 'util';

const mainRoutes = express.Router();
const appname = process.env.APP_NAME || "Not Twitter";
const d: Date = new Date();

mainRoutes.get('/', (req: Request, res: Response) => {
	res.render('index', { appname: appname, year: d.getFullYear() });
});

mainRoutes.get('/profile/:handle', async (req: Request, res: Response) => {
	const { handle } = req.params;
	
	try {
		const getProfileData = await agent.getProfile({actor: handle});
		const profileData = getProfileData.data;
		const getFeed = await agent.getAuthorFeed({actor: handle, limit: 20});
		const feedData = getFeed.data;
		console.log(util.inspect(feedData, { colors: true, depth: null, showHidden: true,}));
		res.render('profile', { appname: appname, year: d.getFullYear(), data: profileData, feed: feedData });
	} catch(error) {
		res.status(500).send("Cannot fetch data");
	}
});

mainRoutes.get('/trends', async (req: Request, res: Response) => {
	res.set({'Content-Type': 'application/json'});
	res.render('trends');
});

mainRoutes.get('/trends/dialog', async (req: Request, res: Response) => {
	res.set({'Content-Type': 'application/json'});
	res.render('dialog');
});

export default mainRoutes;