[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

<br />
<p align="center">
  <h3 align="center">Alkitab API V2</h3>
  <p align="center">
    <br />
    <a href="https://fulk-bible.vercel.app">View Demo</a>
    ·
    <a href="https://github.com/indrapalijama/alkitab-api-v2/issues">Report Bug</a>
    ·
    <a href="https://github.com/indrapalijama/alkitab-api-v2/issues">Request Feature</a>
  </p>
</p>

<!-- ABOUT THE PROJECT -->

## About The Project

Simple Alkitab API using expressJS, scrapped from mentioned source.

### Tech Stack

- [Express JS](https://github.com/expressjs/express)
- [CheerioJS](https://cheerio.js.org) - Web scraping HTML parser
- [Google Play Scraper](https://github.com/facundoolano/google-play-scraper) - Live Play Store metadata & release notes
- [Axios](https://axios-http.com) - HTTP client
- [@aws-sdk/client-s3](https://github.com/aws/aws-sdk-js-v3) - Cloudflare R2 / S3 storage integration
- [Vercel](https://vercel.com) - Serverless Edge CDN hosting

---

## API Endpoints

### 0. Interactive API Documentation (Swagger UI)

- **Interactive Swagger UI:** [`/docs`](https://fulk-bible.vercel.app/docs) or [`/api-docs`](https://fulk-bible.vercel.app/api-docs)
- **Raw OpenAPI 3.0 Spec (JSON):** [`/docs/openapi.json`](https://fulk-bible.vercel.app/docs/openapi.json)

> **Authentication in Swagger UI:** Protected endpoints (`/bible`, `/reflection`, `/song`) require an `accesskey` header. You can click the **Authorize** button in Swagger UI to test protected endpoints directly.

### 1. App Version & Dynamic What's New

```http
GET /app/version?lang={id|en}&country={id|us}
```

Queries Google Play Store for the live app version and official release notes (`recentChanges`) matching the user's locale.

- **Caching:** 15-Minute Vercel Edge CDN cache (`public, max-age=900, s-maxage=900, stale-while-revalidate=1800`).
- **Response Format:**
  ```json
  {
    "latestVersionName": "1.4.3",
    "url": "https://play.google.com/store/apps/details?id=fulk.evilcorp.dailyreflection&hl=id&gl=id",
    "forceUpdate": false,
    "minVersionCode": 0,
    "recentChanges": "- Pemulihan favorit dan sinkronisasi cloud lebih andal.\n- Tampilan \"Yang Baru\" dinamis serta deteksi update lebih cepat."
  }
  ```

### 2. Bible Reader

```http
GET /bible/read/:book/:chapter
GET /bible/read/:book/:chapterAndVerse
```

### 3. Daily Reflections

```http
GET /reflection/:source
```
Supported sources: `sh` (Santapan Harian), `rh` (Renungan Harian), `roc` (Renungan Oswald Chambers).

### 4. Hymns (Kidung)

```http
GET /song/:source/list
GET /song/detail/:source/:id
```
Supported hymn books: `KJ` (Kidung Jemaat), `PKJ` (Pelengkap Kidung Jemaat), `NKB` (Nyanyikanlah Kidung Baru).

---

<!-- GETTING STARTED -->

## Getting Started

To get a local copy up and running follow these simple steps.

### Prerequisites

- Node.js 22.x
- npm
  ```sh
  npm install npm@latest -g
  ```

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/indrapalijama/alkitab-api-v2.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Run the Application
   ```sh
   npm run start
   ```

<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<!-- TO-DO List -->

## To-do List

- [x] Get Chapter Info (Verses Count)
- [x] Add Daily Reflection (Renungan Harian / Santapan Harian)
- [x] Add New Source for Daily Reflection (Renungan Oswald Chambers)
- [x] Get List of All Books
- [x] Get Kidung Song List (KJ, PKJ, NKB)
- [x] Get Song Detail (KJ, PKJ, NKB)
- [x] App version detection & dynamic What's New from Google Play (`/app/version`)
- [x] 15-minute Edge CDN caching for version checks
- [x] Add Swagger API documentation (`/docs`)
- [ ] Get All Bible Version / Language List
- [ ] Get All Bible Version / Language Detail

<!-- SOURCE -->

## Source

Alkitab Mobile SABDA [http://alkitab.mobi/](http://alkitab.mobi/)

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE` for more information.

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/indrapalijama/mobile-news-platform.svg?style=for-the-badge
[contributors-url]: https://github.com/indrapalijama/alkitab-api-v2/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/indrapalijama/mobile-news-platform.svg?style=for-the-badge
[forks-url]: https://github.com/indrapalijama/alkitab-api-v2/network/members
[stars-shield]: https://img.shields.io/github/stars/indrapalijama/mobile-news-platform.svg?style=for-the-badge
[stars-url]: https://github.com/indrapalijama/alkitab-api-v2/stargazers
[issues-shield]: https://img.shields.io/github/issues/indrapalijama/mobile-news-platform.svg?style=for-the-badge
[issues-url]: https://github.com/indrapalijama/alkitab-api-v2/issues
[license-shield]: https://img.shields.io/github/license/indrapalijama/mobile-news-platform.svg?style=for-the-badge
[license-url]: https://github.com/indrapalijama/alkitab-api/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/indrapalijama
