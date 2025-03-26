// src/auxRoutes.ts
import express, { Request, Response } from 'express';
import { agent } from './api';

const auxRoutes = express.Router();
const appname = process.env.APP_NAME || "Not Twitter";

auxRoutes.get('/i/expanded/batch/:id', async (req: Request, res: Response) => {
	const { id } = req.params;
	
	try {
		res.set({'Content-Type': 'application/json'});
	const getThread = await agent.getPostThread({ uri: id });
    const threadData = getThread.data;

	res.render('expand', { thread: threadData.thread });
		
	} catch(error) {
		res.status(500).send("Cannot fetch data");
	}
});

interface RequestQuery {
	async_social_proof: boolean;
	user_id: string;
	id: string;
}

auxRoutes.get('/i/profiles/popup', async (req: Request, res: Response) => {	
	try {
	const { async_social_proof, user_id } = req.query as unknown as RequestQuery;
			
	res.set({'Content-Type': 'application/json'});
	const getProfileData = await agent.getProfile({actor: user_id});
    const profileData = getProfileData.data;

	res.render('popup', { data: profileData });
		
	} catch(error) {
		res.status(500).send("Cannot fetch data");
	}
});

auxRoutes.get('/api/1/statuses/oembed.:format', async (req: Request, res: Response) => {	
	try {
	const { id } = req.query as unknown as RequestQuery;
	var { format } = req.params;
	const getThread = await agent.getPostThread({uri: id});
	const threadData = getThread.data;
	
		if (format=='json') {
			res.set({'Content-Type': 'application/json'});
			res.render('oembed', { data: threadData.thread, host: req.headers.host, appname: appname });
		} else if (format=='xml') {
			res.set({'Content-Type': 'application/xml'});
			res.render('oembed_xml', { data: threadData.thread, host: req.headers.host, appname: appname });
		} else {
			res.set({'Content-Type': 'application/xml'});
			res.render('oembed_xml', { data: threadData.thread, host: req.headers.host, appname: appname });
		}
	} catch(error) {
		res.status(500).send("Cannot fetch data");
	}
});

export default auxRoutes;