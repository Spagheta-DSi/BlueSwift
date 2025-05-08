// src/mainRoutes.ts
import express, { Request, Response, NextFunction } from 'express';
import { authAgent, agent } from './api';

const mainRoutes = express.Router();
const appname = process.env.APP_NAME || "BlueSwift";
const d: Date = new Date();

mainRoutes.get('/', (req: Request, res: Response) => {
	const handle = req.cookies['handle'];
	const password = req.cookies['password'];
	
	if (!handle || !password) {
		res.render('index', { appname: appname, year: d.getFullYear() });
	} else {
		res.redirect('/home');
	};
});

mainRoutes.get('/profile/:handle', async (req: Request, res: Response) => {
	const { handle } = req.params;
	try {
		const getProfileData = await agent.app.bsky.actor.getProfile({actor: handle});
		const profileData = getProfileData.data;
		const getFeed = await agent.app.bsky.feed.getAuthorFeed({actor: handle, limit: 20});
		const feedData = getFeed.data;

		res.render('profile', { appname: appname, year: d.getFullYear(), data: profileData, feed: feedData.feed, feed_aux: feedData });
	} catch(error) {
		res.status(500).send("Cannot fetch data");
	}
});

mainRoutes.get('/profile/:handle/status/:rkey', async (req: Request, res: Response) => {
	const { handle, rkey } = req.params;

	try {
		const getThread = await agent.app.bsky.feed.getPostThread({uri: `at://${handle}/app.bsky.feed.post/${rkey}`});
		const threadData = getThread.data;
		const getDid = await agent.com.atproto.identity.resolveHandle({handle: handle});
		const didData = getDid.data;
		const getLikes = await agent.app.bsky.feed.getLikes({uri: `at://${didData.did}/app.bsky.feed.post/${rkey}`, limit: 9});
		const likesData = getLikes.data;
		
		res.render('post', { appname: appname, year: d.getFullYear(), data: threadData.thread, likes: likesData.likes });
	} catch(error) {
		res.status(500).send("Cannot fetch data");
	}
});

mainRoutes.get('/profile/:handle/lists/:list', async (req: Request, res: Response) => {
	const { handle, list } = req.params;

	try {
		const getDid = await agent.com.atproto.identity.resolveHandle({handle: handle});
		const didData = getDid.data;		
		const getGenerator = await agent.app.bsky.feed.getFeedGenerator({feed: `at://${didData.did}/app.bsky.feed.generator/${list}`});
		const generatorData = getGenerator.data;
		const getFeeds = await agent.app.bsky.feed.getActorFeeds({actor: handle});
		const feedsData = getFeeds.data;
		const getFeed = await agent.app.bsky.feed.getFeed({feed: `at://${didData.did}/app.bsky.feed.generator/${list}`, limit: 20});
		const feedData = getFeed.data;
		
		res.render('list', { appname: appname, year: d.getFullYear(), data: generatorData.view, feed: feedData.feed, feed_aux: feedData, feeds: feedsData, listname: list });
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

mainRoutes.get('/login', async (req: Request, res: Response) => {
	const { redirect_after_login } = req.query;
	
	res.render('login', { appname: appname, redir: redirect_after_login, error: req.flash('error') });
});


interface RequestQuery {
	redirect_after_login: string;
}

interface LoginFormBody {
	session: {
		username_or_email: string;
		password: string;
	}
}
	
mainRoutes.get('/home', async (req: Request, res: Response) => {
	const handle = req.cookies['handle'];
	const password = req.cookies['password'];
	
	if (!handle || !password) {
		return res.redirect('login?redirect_after_login=/home');
	}
	
	try {
		await authAgent.login({
			identifier: handle,
			password: password
		})
		const timeline = await authAgent.app.bsky.feed.getTimeline({ limit: 20 });
		const timelineData = timeline.data;
		const currentUser = handle;
		const curUserProf = await agent.app.bsky.actor.getProfile({ actor: currentUser });
		const userProfData = curUserProf.data;
		
		res.render('home', { appname: appname, year: d.getFullYear(), timeline: timelineData, profileData: userProfData });
	} catch(error) {
		res.status(500).send("Cannot fetch data");
	}
});

mainRoutes.post('/sessions', async (req: Request, res: Response) => {
	const { session } = req.body as LoginFormBody;
	const { redirect_after_login } = req.query;
	try {
		await authAgent.login({
			identifier: session.username_or_email,
			password: session.password
		});
		res.cookie("handle", session.username_or_email, { httpOnly: true });
		res.cookie("password", session.password, { httpOnly: true });
		res.redirect(`${redirect_after_login}` || '/home');
	} catch(error) {
		res.status(401).send("Unable to authorize");
	}
});

mainRoutes.post('/logout', async (req: Request, res: Response) => {
	res.clearCookie('handle', { httpOnly: true });
	res.clearCookie('password', { httpOnly: true });
	req.session.destroy((error) => {
		res.redirect('/');
	});
});

export default mainRoutes;