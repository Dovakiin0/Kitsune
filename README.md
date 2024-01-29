![logo.png](logo.png)

Watch your favourite anime anywhere, anytime. No Ads.

Previously called [**AnimeWorldz**](https://github.com/Dovakiin0/Kitsune/tree/v2.0), Kitsune is a free, open-source anime streaming website. It is built using the [Next Js](https://nextjs.org/) framework and [Tailwind CSS](https://tailwindcss.com/).

_Kitsune is still under development and may encounter many bugs. Feel free to open any issue regarding bugs or features_

Also checkout the mobile app: [Android](https://github.com/Dovakiin0/animeworldz-mobile), which is still called AnimeWorldz but will later be updated.

## Features

- **No Ads** - No ads, no popups, no redirects, no bullshit.
- **PWA Support** - Kitsune is a PWA, which means you can install it on your phone.

## Contributing

```
fork the repo

git clone <forked-repo>
git checkout -b <new-feature>
git add <changed-file>
git commit -m "New feature"
git push origin <new-feature>

then submit a pull request
```

## Local Development

```
clone the repo
cd kitsune/
npm install or yarn
```

rename the `.env.example` file to `.env` then set in TMDB access key (READ ACCESS TOKEN) and vercel KV(optional).  
then run the app

```
npm run dev or yarn dev
```

## Deployment

Kitsune uses vercel KV to cache data. However, it is optional. To use caching you can create your own KV instance.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDovakiin0%2FKitsune)

If you are deploying to vercel. Make sure to set ENVIRONMENT VARIABLE `TMDB_ACCESS_KEY` and set it your access key.

#### Docker

You can use docker to build and deploy kitsune. Check this repo [KitsuneDocker](https://github.com/Ve-Ka/KitsuneDocker)

## Credits

[Consumet](https://github.com/consumet/consumet.ts)
[Enime-Project](https://github.com/Enime-Project/api.enime.moe)
[anime-data](https://github.com/Dovakiin0/anime-data)

## Support

Join the Discord server: <https://discord.gg/6yAJ3XDHTt>
