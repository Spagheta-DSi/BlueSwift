// src/index.ts
import express, { Express } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { routes } from './routes';
import { engine } from 'express-handlebars';
import moment from 'moment';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import expressSession from 'express-session';
import bodyParser from 'body-parser';
import morgan, { StreamOptions } from 'morgan';
import flash from 'express-flash';
import jsesc from 'jsesc';
import handlebars = require("handlebars");

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;
const appname = process.env.APP_NAME || "BlueSwift";

app.set('view engine', 'hbs');
app.engine('hbs', engine({
	extname: 'hbs',
	defaultLayout: false,
	helpers: {
		formatNumber: function(number: number) {
			return number.toLocaleString("en-US");
		},
		formatDate: function(date: string | Date, format: string): string {
			return moment(date).format(format);
		},
		emojiBytecode: function(text: string): string {
			if (!text) return "";
			return jsesc(text);
		},
		jsonEscape: function(text: string): string {
			if (!text) return "";
			return JSON.stringify(text);
		},
		getRkey: function(uri: string): string | null {
			const regex = /at:\/\/did:plc:[^/]+\/app\.bsky\.feed\.post\/([^/?#]+)/;
			const match = uri.match(regex);
			return match ? match[1] : null;
		},
		truncateTitle: function(str: string): string {
			if (str.length <= 30) {
				return str;
			}
			return str.slice(0, 30) + ' ...';
		}
		}
}));

app.set('views', path.join(__dirname, '../views'));

app.use(express.static('public'));
app.use(morgan('tiny'));
app.use(bodyParser.urlencoded({
	extended: true,
}));
app.use(cookieParser());
app.use(expressSession({
	secret: process.env.SECRET_KEY || crypto.randomBytes(32).toString('hex'),
	resave: false,
	saveUninitialized: false,
	cookie: { secure: false },
}));
app.use(flash());

app.use('/', routes);

app.listen(port, () => {
	console.log(`[server] Server is running on http://localhost:${port}`);
});