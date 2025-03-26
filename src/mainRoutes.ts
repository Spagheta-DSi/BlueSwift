// src/mainRouter.ts
import express, { Request, Response } from 'express';
import { authAgent, agent } from './api';

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
		res.render('profile', { appname: appname, year: d.getFullYear(), data: profileData, feed: feedData.feed });
	} catch(error) {
		res.status(500).send("Cannot fetch data");
	}
});

mainRoutes.get('/profile/:handle/status/:rkey', async (req: Request, res: Response) => {
	const { handle, rkey } = req.params;
	
	try {
		const getThread = await agent.getPostThread({uri: `at://${handle}/app.bsky.feed.post/${rkey}`});
		const threadData = getThread.data;
		const getLikes = await agent.getLikes({uri: `at://${handle}/app.bsky.feed.post/${rkey}`, limit: 9});
		const likesData = getLikes.data;
		res.render('post', { appname: appname, year: d.getFullYear(), data: threadData.thread, likesData });
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

/* mainRoutes.get('/login', async (req: Request, res: Response) => {
	const { redirect_after_login } = req.query;
	res.render('login', { appname: appname, redir: redirect_after_login });
});

*/
interface RequestQuery {
	redirect_after_login: string;
}

/* mainRoutes.get('/home', async (req: Request, res: Response) => {
	const handle = req.cookies['handle'];
	const password = req.cookies['password'];
	
	if (!handle || !password) {
		res.redirect('login?redirect_after_login=/home');
	}
	try {
		await authAgent.login({
			identifier: handle,
			password: password
		})
		const timeline = await authAgent.getTimeline({ limit: 20 });
		const timelineData = timeline.data;
		const currentUser = handle;
		
		res.render('home', { appname: appname, year: d.getFullYear(), data: timelineData });
	} catch(error) {
		res.status(500).send("Cannot fetch data");
	}
});
 */

/* mainRoutes.post('/sessions', async (req: Request, res: Response) => {
	const username_or_email = req.query['session[username_or_email]'] as string;
	const password = req.query['session[password]'] as string;
	const { redirect_after_login } = req.query;

	try {
		await authAgent.login({
			identifier: username_or_email,
			password: password
		});
		res.cookie("handle", username_or_email, { httpOnly: true});
		res.cookie("password", password, { httpOnly: true});
		res.redirect(`${redirect_after_login}`);
	} catch(error) {
		res.status(400).send("Unable to authorize");
	}
});
 */
export default mainRoutes;