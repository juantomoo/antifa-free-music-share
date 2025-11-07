# 🚩 Antifa Free Music Share

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║      🚩 ANTIFA FREE MUSIC SHARE 🚩                       ║
║                                                           ║
║      "Liberate Art from Capitalist Chains"               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

**Music belongs to the people, not to corporations.**

*Available in: [Español](README.md) | [English](#) | [Português](README-pt.md)*

---

## 🎵 Our Mission

**Antifa Free Music Share** is a community tool designed to liberate music from streaming monopolies that exploit artists and fund global oppression. This project fights against:

- 🚫 **Streaming platforms** that pay artists $0.003-0.005 per stream while keeping billions
- 🚫 **Corporate monopolies** like Spotify that fund Zionist occupation and genocide  
- 🚫 **Capitalist gatekeepers** that control, censor, and exploit independent voices
- 🚫 **Digital feudalism** that makes you rent access to culture

### ✊ Our Principles

- 🏴 **Anti-fascist, anti-racist, anti-capitalist**
- 🎨 **Artists deserve fair compensation**, not exploitation
- 🌍 **Culture should be accessible** to everyone, not locked behind paywalls
- 💰 **Support artists directly**: Bandcamp, live shows, merch, donations
- 🔓 **Information wants to be free**

> "The only ethical way to consume music under capitalism is to steal it from corporations and pay artists directly."

---

## ✨ Features

### Core Functionality

- 🎧 **YouTube Music Integration**: High-quality music downloads with complete metadata
- 📋 **Playlist Support**: Download entire playlists with smart duplicate detection
- ⚡ **Parallel Downloads**: Up to 5 concurrent downloads for maximum speed
- 🔄 **Smart Resume**: Skip already downloaded files, only process what's needed
- 🎵 **Multiple Sources**: YouTube Music, Spotify, Deezer, Tidal (all download via YouTube)

### Metadata & Enhancement

- 🏷️ **Complete Metadata**: Artist, album, title, year, genre, track numbers
- 🖼️ **Cover Art**: Multiple sources (MusicBrainz, Deezer, Last.fm, Spotify, iTunes, YouTube)
- 📝 **Lyrics**: Automatic fetching from Genius and AZLyrics
- 🎼 **MusicBrainz Integration**: Community-maintained music encyclopedia
- 🔧 **Batch Processing**: Fix metadata, add covers, and lyrics for existing files

### User Experience

- 🌍 **Multi-language**: Spanish, English, Portuguese interface
- 💬 **Interactive Mode**: User-friendly menus and prompts
- 🖥️ **CLI Mode**: Direct commands for advanced users
- ⚙️ **Flexible Configuration**: Customize everything via `.env` or config files
- 📁 **Organized Downloads**: Artist folders, playlist folders, clean naming

---

## 💰 Support Artists Directly

### ✅ How to Support Creators:

1. **Bandcamp** - Artists get 82-85% of sales
2. **Artist websites** - Buy music and merch directly
3. **Patreon/Ko-fi** - Direct support to your favorite creators
4. **Live shows** - Attend concerts and buy merch at venues
5. **Independent labels** - Support labels that respect artists

### 🚫 Boycott Exploitative Platforms:

- **Spotify** - $0.003-0.004 per stream, funds Zionist tech, censors artists
- **Apple Music** - $0.01 per stream (still exploitative), closed ecosystem
- **Amazon Music** - Worker exploitation + artist exploitation
- **YouTube Music** - Google monopoly that censors Palestinian human rights documentaries

#### 🚨 YouTube's Active Censorship Against Palestine

In November 2025, YouTube deleted over **700 videos documenting Israeli war crimes** in Gaza and the West Bank, shutting down accounts of three Palestinian human rights organizations: Al-Haq, Al Mezan Center for Human Rights, and the Palestinian Center for Human Rights.

Deleted content included:
- 📹 Documentary with testimonies from mothers who survived the Gaza genocide
- 🎥 Investigation into the killing of journalist Shireen Abu Akleh
- 📸 Evidence of destruction of Palestinian homes in the West Bank

**YouTube acted under pressure from Trump's government and its sanctions against organizations that cooperated with the International Criminal Court** on Israeli war crimes cases.

> "YouTube's removal represents a grave violation of principles and an alarming setback for human rights and freedom of expression." - Al-Haq spokesperson

**This is why we boycott YouTube too:** They don't just exploit artists—they actively silence Palestinian voices and cover up genocide.

📰 Source: [HispanTV - YouTube deletes 700 videos documenting Israeli war crimes](https://www.hispantv.com/noticias/palestina/634255/youtube-borra-videos-crimenes-israelies) (November 5, 2025)

### 📊 The Math:

- **1,000 Spotify streams** = $3-4 for the artist  
- **1 Bandcamp album** = $7-9 for the artist  
- **1 concert ticket** = $15-30 for the artist  
- **1 t-shirt** = $10-20 for the artist  

**Use this tool + buy direct = Artists win**

---

## 📦 Installation

### Prerequisites

- **Node.js 18+** ([Download](https://nodejs.org/))
- **yt-dlp** ([Installation guide](https://github.com/yt-dlp/yt-dlp#installation))
- **ffmpeg** (for audio conversion)

### Install yt-dlp

**Linux/macOS:**
```bash
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

**Windows (via Chocolatey):**
```bash
choco install yt-dlp
```

### Install Application

1. **Clone the repository:**
```bash
git clone https://github.com/juantomoo/antifa-free-music-share.git
cd antifa-free-music-share
```

2. **Install dependencies:**
```bash
npm install
```

3. **Build the project:**
```bash
npm run build
```

4. **Configure (optional):**
```bash
cp .env.example .env
# Edit .env with your API keys (optional but recommended)
```

---

## 🚀 Usage

### Interactive Mode (Recommended)

```bash
npm start
```

This launches an interactive menu where you can:
1. Search for tracks (YouTube Music search)
2. Download a playlist or album (paste URL)
3. Download a single track (paste URL)
4. Fix metadata for existing files
5. Add cover art to existing files
6. Add lyrics to existing files
7. Batch process existing files

### CLI Mode

**Download a playlist:**
```bash
node dist/main.js playlist https://music.youtube.com/playlist?list=...
```

**Download a single track:**
```bash
node dist/main.js track https://music.youtube.com/watch?v=...
```

**Search and download:**
```bash
node dist/main.js search "Artist - Song Name"
```

---

## 📄 License

**GPL-3.0-or-later**

This project is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This ensures:
- ✅ Freedom to use, study, modify, and share
- ✅ Copyleft protection (modifications must stay free)
- ✅ No corporate appropriation
- ✅ Community ownership

See [LICENSE](LICENSE) file for full details.

---

## 🙏 Acknowledgments

### Built on the Shoulders of Giants

This project would not exist without:

**🌟 [yt-dlp](https://github.com/yt-dlp/yt-dlp) - The Backbone of This Project**

yt-dlp is the beating heart of Antifa Free Music Share. This incredible community-maintained fork of youtube-dl provides:
- 🎵 High-quality audio extraction from YouTube and 1000+ sites
- 🔧 Active development and constant improvements
- 🆓 Completely free and open-source (Unlicense)
- 🛡️ Resistance against corporate takedowns and censorship

**Without yt-dlp, this project would not be possible.** Massive respect to all contributors fighting to keep media liberation tools alive against corporate suppression.

**Other Essential Projects:**

- **[MusicBrainz](https://musicbrainz.org/)** - Community music encyclopedia (CC0 license)
- **[Cover Art Archive](https://coverartarchive.org/)** - Free cover art database
- **[Genius](https://genius.com/)** - Lyrics database
- **[AZLyrics](https://www.azlyrics.com/)** - Open lyrics archive

### Inspired By

- 🏴 **Free culture movement** - Culture should be free for all
- ✊ **Anti-capitalist tech collectives** - Technology for liberation, not exploitation
- 🎵 **Underground music communities** - DIY spirit and mutual aid
- 🚩 **Artists fighting for their rights** - Against streaming exploitation
- 💪 **Anti-fascist organizers** - Culture as resistance

---

## 📞 Contact & Community

**Developed by:** [Eonaria Project](https://github.com/juantomoo)

**Repository:** https://github.com/juantomoo/antifa-free-music-share

---

## 🔥 Final Words

```
"When injustice becomes law, resistance becomes duty."

This tool is resistance.

Liberate art. Support artists. Fight fascism.

🚩 ✊ 🏴
```

**NO PASARÁN**

---

*This project stands in solidarity with:*
- 🇵🇸 Palestine against Israeli genocide
- 🏴 Anti-fascist movements worldwide
- ✊ Workers fighting capitalist exploitation
- 🌍 Indigenous peoples defending their lands
- 🏳️‍🌈 LGBTQ+ people resisting oppression
- 🚩 All those struggling for liberation

**Culture is a weapon. Use it wisely.**
