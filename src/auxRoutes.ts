// src/auxRoutes.ts
import express, { Request, Response } from 'express';
import { agent, authAgent } from './api';
import { RichText } from '@atproto/api'
import { AtUri } from '@atproto/syntax';
import multer from 'multer';

const auxRoutes = express.Router();
const appname = process.env.APP_NAME || "BlueSwift";

interface Template {
    name: string;
    data: any;
}

auxRoutes.get('/i/expanded/batch/:id', async (req: Request, res: Response) => {
	const { id } = req.params;
	
	try {
	res.set({'Content-Type': 'application/json'});
	const getThread = await agent.app.bsky.feed.getPostThread({ uri: id, depth: 20 });
    const threadData = getThread.data;
	const getLikes = await agent.app.bsky.feed.getLikes({ uri: id, limit: 9 });
    const likesData = getLikes.data;

    const templates: Template[] = [
		{ name: 'descendants', data: ''},
		{ name: 'social_proof', data: { thread: threadData.thread, likes: likesData.likes }},
		{ name: 'ancestors', data: { thread: threadData.thread }},
	];
	
	const renderedHtml: { [key: string]: string } = {};

    const renderTemplate = (template: Template): Promise<void> => {
        return new Promise((resolve, reject) => {
            res.render(template.name, template.data, (err: Error | null, html: string) => {
                if (err) {
                    return reject(`Failed to render ${template.name}`);
                }
                renderedHtml[template.name] = html;
                resolve();
            });
        });
    };

    const renderTemplatesInOrder = async () => {
        try {
            for (const template of templates) {
                await renderTemplate(template);
            }
            res.json(renderedHtml);
        } catch (error) {
            res.status(500).json({ error: 'Failed to render templates' });
        }
    };

    renderTemplatesInOrder();
	
	} catch(error) {
		res.status(500).send("Cannot fetch data");
	}
});

interface RequestQuery {
	async_social_proof: boolean;
	user_id: string;
	id: string;
	count: number;
	q: string;
	result_type: string;
	max_id: string;
}

auxRoutes.get('/i/profiles/popup', async (req: Request, res: Response) => {	
	try {
	const { async_social_proof, user_id } = req.query as unknown as RequestQuery;
			
	res.set({'Content-Type': 'application/json'});
	const getProfileData = await agent.app.bsky.actor.getProfile({actor: user_id});
    const profileData = getProfileData.data;
	const getFeed = await agent.app.bsky.feed.getAuthorFeed({actor: user_id, limit: 5});
	const feedData = getFeed.data;
	
	res.render('popup', { data: profileData, feed: feedData.feed }, function(e, renderedHtml) {
		if (e) {
			console.error('Error:', e);
		} else {
			const popup = {
				screen_name: profileData.handle,
				user_id: profileData.did,
				html: renderedHtml,
			};
			
			res.json(popup);
		};
	});
	
	} catch(error) {
		res.status(500).send("Cannot fetch data");
	}
});

auxRoutes.post('/i/tweet/create', async (req: Request, res: Response) => {
	const { status } = req.body;
	const handle = req.cookies['handle'];
	const password = req.cookies['password'];
	
	if (!handle || !password) {
		res.redirect('login?redirect_after_login=/');
	}
	
	const rt = new RichText({
		text: status,
	});
	

	try {
		await rt.detectFacets(authAgent);
		
		const postRecord = {
			//$type: 'app.bsky.feed.post',
			text: rt.text,
			facets: rt.facets,
			createdAt: new Date().toISOString(),
		};		
		
		await authAgent.login({
			identifier: handle,
			password: password
		});
		
		await authAgent.post(postRecord);
	} catch(error) {
		res.status(401).send("Unauthorized");
	}
});

const storage = multer.memoryStorage()
const upload = multer({ storage: storage, dest: './tmp' });

auxRoutes.post('/i/tweet/create_with_media.iframe', upload.single('media_data'), async (req: Request, res: Response) => {	// this whole thing is jank af please fix
	const { status } = req.body;
	const handle = req.cookies['handle'];
	const password = req.cookies['password'];
	
	if (!handle || !password) {
		res.redirect('login?redirect_after_login=/');
	}
	
	const rt = new RichText({
		text: status,
	});
	
	const mediaData = req.file!.buffer;
	
	if(!mediaData) {
	//	res.status(400).send("No image uploaded");
	}
	
	try {
		const blobUpload = await authAgent.uploadBlob(mediaData, {encoding: 'image/jpg'});
		await rt.detectFacets(authAgent);
		
		const postRecord = {
			//$type: 'app.bsky.feed.post',
			text: rt.text,
			facets: rt.facets,
			embed: {
				images: [
				{
					image: blobUpload.data.blob, 
					alt: '',
				}
				],
				$type: 'app.bsky.embed.images',
			},
			createdAt: new Date().toISOString(),
		};
	
		await authAgent.login({
			identifier: handle,
			password: password
		});
		await authAgent.post(postRecord);
		
	} catch(error) {
		console.log(error);
		res.status(401).send("Unauthorized");
	}
});

auxRoutes.get('/i/search/typeahead.json', async (req: Request, res: Response) => {	
	try {
	const { count, q, result_type } = req.query as unknown as RequestQuery;
			
	res.set({'Content-Type': 'application/json'});

    const [searchActor, searchPost] = await Promise.all([
      agent.app.bsky.actor.searchActors({ q: q, limit: 9 }),
      agent.app.bsky.feed.searchPosts({ q: q })
    ]);

    const actorData = searchActor.data;
    const totalActors = actorData.actors.length;

    const actors = actorData.actors.map(actor => ({
      id: actor.did,
      verified: false,
      is_dm_able: false,
      name: actor.displayName,
      screen_name: actor.handle,
      profile_image_url: actor.avatar,
      profile_image_url_https: actor.avatar,
      rounded_score: 7400,
      social_proof: 0,
      connecting_user_count: 0,
      connecting_user_ids: [],
      social_proofs_ordered: [],
      tokens: [
        { token: actor.handle },
        { token: `@${actor.handle}` }
      ],
      inline: false
    }));

    const response = {
      num_results: totalActors.toString(),
      users: actors,
      topics: [
        {
          topic: "not gonna",
          rounded_score: 40633,
          tokens: [{ token: "not" }, { token: "gonna" }],
          inline: false
        },
        {
          topic: "not gonna implement",
          rounded_score: 600,
          tokens: [{ token: "not" }, { token: "gonna" }, { token: "implement" }],
          inline: false
        }
      ],
      oneclick: [],
      hashtags: [],
      completed_in: 0.004,
      query: q
    };

    res.json(response);

	} catch(error) {
		res.status(500).send("Cannot fetch data");
	}
});
/*
auxRoutes.get('/i/profiles/show/:handle/timeline/with_replies', async (req: Request, res: Response) => {	
	try {
	const { handle } = req.params;
	const { max_id, user_id } = req.query as unknown as RequestQuery;
			
	res.set({'Content-Type': 'application/json'});
	const getFeed = await agent.app.bsky.feed.getAuthorFeed({actor: handle, limit: 20, cursor: max_id});
	const feedData = getFeed.data;
	
	res.render('items_html', { feed: feedData.feed }, function(e, renderedHtml) {
		if (e) {
			console.error('Error:', e);
		} else {
			const timeline = {
				has_more_items: true,
				max_id: max_id,
				items_html: renderedHtml,
			};
			
			res.json(timeline);
		};
	});
	
	} catch(error) {
		res.status(500).send("Cannot fetch data");
	}
});*/


auxRoutes.get('/api/1/statuses/oembed.:format', async (req: Request, res: Response) => {	
	try {
	const { id } = req.query as unknown as RequestQuery;
	var { format } = req.params;
	const getThread = await agent.getPostThread({uri: id});
	const threadData = getThread.data;
	const host = req.headers.host;
	const uri = new AtUri(id);
	
		if (format=='json') {
			res.set({'Content-Type': 'application/json'});
			
			res.render('oembed_html', { data: threadData.thread }, function(e, renderedHtml) {
			if (e) {
				console.error('Error:', e);
			} else {
				const oembed = {
					'cache_age': 3153600000,
					'url': `https://${host}/profile/${uri.hostname}/statuses/${uri.rkey}`,
					'height': null,
					'provider_url': `https://${host}`,
					'provider_name': appname,
					'author_name': uri.hostname,
					'version': '1.0',
					'author_url': `https://${host}/profile/${uri.hostname}`,
					'type': 'rich',
					'html': renderedHtml,
					'width': 550,
				};
			
				res.json(oembed);
			};
		});
	
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