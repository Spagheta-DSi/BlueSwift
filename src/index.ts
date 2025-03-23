// src/index.ts
import express, { Express } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { routes } from './routes';
import { engine } from 'express-handlebars';
import moment from 'moment';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'hbs');
app.engine('hbs', engine({
	extname: 'hbs',
	defaultLayout: false,
	helpers: {
		formatNumber: function(number: number) {
			return number.toLocaleString();
		},
		formatDate: function(date: string | Date, format: string): string {
			return moment(date).format(format);
		}
	}
}));
app.set('views', path.join(__dirname, '../views'));

app.use(express.static('public'));

app.use('/', routes);

app.listen(port, () => {
	console.log(`[server] Server is running on http://localhost:${port}`);
});