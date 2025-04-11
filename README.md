# BlueSwift
A Bluesky web client based off 2013 Twitter

## `.env` Variables
- `PORT` - self-explanatory.
- `APP_NAME` - the name for your instance of this client.
- `SECRET_KEY` - self-explanatory.


## Hosting guide
1. Clone the repository.

```bash 
git clone https://github.com/Spagheta-DSi/BlueSwift.git
```

2. Duplicate and rename `.env.example` as `.env`.

3. Configure the variables in `.env`.

4. Install the necessary packages.

```
npm install
```
5. Run the instance.
```
npx ts-node src/index.ts
```
Or alternatively, you can run the instance with `nodemon`. 
```
npm run dev
```
