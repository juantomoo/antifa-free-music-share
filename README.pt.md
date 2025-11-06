# 🚩 Antifa Free Music Share

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║      🚩 ANTIFA FREE MUSIC SHARE 🚩                       ║
║                                                           ║
║      "Liberte a Arte das Correntes Capitalistas"         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

**A música pertence ao povo, não às corporações.**

*Disponível em: [English](README.md) | [Español](README.es.md) | [Português](#)*

---

## 🎵 Nossa Missão

**Antifa Free Music Share** é uma ferramenta comunitária projetada para liberar a música dos monopólios de streaming que exploram artistas e financiam a opressão global. Este projeto luta contra:

- 🚫 **Plataformas de streaming** que pagam $0.003-0.005 por reprodução enquanto ficam com bilhões
- 🚫 **Monopólios corporativos** como Spotify que financiam ocupação e genocídio sionista
- 🚫 **Guardiões capitalistas** que controlam, censuram e exploram vozes independentes
- 🚫 **Feudalismo digital** que faz você pagar aluguel para acessar cultura

### ✊ Por Que Lutamos

Música e arte são **patrimônio humano**. Devem ser acessíveis a todos, não trancadas atrás de paywalls que enriquecem bilionários enquanto artistas lutam para sobreviver.

As principais plataformas de streaming:

- Pagam centavos aos artistas enquanto lucram bilhões
- Financiam regimes opressivos e ocupação militar
- Censuram artistas políticos e independentes
- Controlam a distribuição cultural através de algoritmos
- Fazem você pagar aluguel mensal por acesso à cultura

**Isso está errado. Nós lutamos de volta.**

---

## 🔓 O Que Esta Ferramenta Faz

Antifa Free Music Share permite:

✅ **Construir coleções pessoais** livres do controle corporativo  
✅ **Baixar do YouTube Music** com metadados completos  
✅ **Processar playlists** com downloads paralelos inteligentes  
✅ **Consertar bibliotecas existentes** (metadados, capas, letras)  
✅ **Suportar múltiplos idiomas** (inglês, espanhol, português)  
✅ **Acessar metadados precisos** de MusicBrainz, Spotify, Deezer  
✅ **Embutir capas de alta qualidade** de múltiplas fontes  
✅ **Adicionar letras automaticamente** de Genius e AZLyrics  

### Especialista em Música Underground

Esta ferramenta se destaca em encontrar metadados precisos para:

- Artistas underground e independentes
- Gêneros de nicho (darkwave, industrial, noise, experimental)
- Música não anglófona
- Artistas ignorados por plataformas mainstream

---

## 💰 Como Apoiar Artistas DE VERDADE

**Esta ferramenta NÃO é sobre roubar de artistas.** É sobre liberar música de plataformas que roubam DOS artistas.

### ✅ Apoie Artistas Diretamente

1. **Bandcamp** - Artistas recebem 80-90% das vendas (vs. $0.003 por stream do Spotify)
2. **Sites de artistas** - Compre música e produtos diretamente
3. **Mídia física** - Vinis, CDs, fitas de lojas independentes
4. **Shows ao vivo** - Vá a concertos e compre produtos nos locais
5. **Patreon/Ko-fi** - Apoio direto aos seus criadores favoritos
6. **Gravadoras independentes** - Apoie selos que respeitam artistas

### 🚫 Boicote Plataformas Exploradoras

- **Spotify** - $0.003-0.004 por stream, financia tech sionista, censura artistas
- **Apple Music** - $0.01 por stream (ainda explorador), ecossistema fechado
- **Amazon Music** - Exploração de trabalhadores + exploração de artistas
- **YouTube Music** - Monopólio do Google, compensação terrível para artistas

### 📊 A Matemática

- **1.000 streams do Spotify** = $3-4 para o artista  
- **1 álbum no Bandcamp** = $7-9 para o artista  
- **1 ingresso de show** = $15-30 para o artista  
- **1 camiseta** = $10-20 para o artista  

**Use esta ferramenta + compre direto = Artistas ganham**

---

## 🛠️ Instalação

### Pré-requisitos

- **Node.js 18+** ([Download](https://nodejs.org/))
- **yt-dlp** ([Guia de instalação](https://github.com/yt-dlp/yt-dlp#installation))
- **ffmpeg** (para conversão de áudio)

```bash
# Ubuntu/Debian
sudo apt install ffmpeg
pip install yt-dlp

# macOS
brew install ffmpeg yt-dlp

# Fedora
sudo dnf install ffmpeg
pip install yt-dlp
```

### Instalar Antifa Free Music Share

```bash
# Clonar o repositório
git clone https://github.com/juantomoo/antifa-free-music-share.git
cd antifa-free-music-share

# Instalar dependências
npm install

# Compilar o projeto
npm run build

# Executar a aplicação
npm start
```

### Configuração

1. Copiar template de ambiente:

```bash
cp .env.example .env
```

2. (Opcional) Adicionar chaves API ao `.env`:

```env
# Para melhores capas (opcional)
SPOTIFY_CLIENT_ID=seu_client_id
SPOTIFY_CLIENT_SECRET=seu_client_secret

# Para letras (opcional)
GENIUS_ACCESS_TOKEN=seu_token

# Contato MusicBrainz (recomendado)
MUSICBRAINZ_CONTACT=seu-email@exemplo.com
```

---

## 🚀 Uso

### Modo Interativo

Execute a aplicação:

```bash
npm start
```

Você será recebido com seleção de idioma e uma mensagem de libertação. Depois escolha entre:

```
🚩 Antifa Free Music Share

? O que você gostaria de fazer?
  🔍 Buscar e baixar faixas
  📋 Baixar playlist
  ──────────────
  🏷️  Corrigir metadados de arquivos existentes
  🖼️  Adicionar capas a arquivos existentes
  📝 Adicionar letras a arquivos existentes
  🔧 Processar arquivos em lote (todas as operações)
  ──────────────
  ⚙️  Configuração
  ❌ Sair
```

### Baixar Playlist

1. Selecione **"📋 Baixar playlist"**
2. Cole a URL da playlist do YouTube Music
3. A ferramenta irá:
   - Extrair todas as faixas com metadados
   - Verificar arquivos existentes
   - Mostrar o que será baixado
   - Pedir confirmação
   - Baixar 5 faixas em paralelo
   - Embutir metadados, capas e letras

### Consertar Biblioteca Existente

#### 🏷️ Corrigir Metadados

- Aponte para seu diretório de música
- A ferramenta escaneia arquivos MP3/FLAC/M4A/OGG
- Usa MusicBrainz para encontrar metadados precisos
- Corrige tags de artista, álbum, ano, gênero

#### 🖼️ Adicionar Capas

- Busca em múltiplas fontes (MusicBrainz, Spotify, Deezer, iTunes, Last.fm)
- Baixa a maior qualidade disponível (até 1200x1200)
- Embute em arquivos de áudio

#### 📝 Adicionar Letras

- Obtém de Genius e AZLyrics
- Embute como letras não sincronizadas (tag USLT)
- Pula arquivos que já têm letras

#### 🔧 Processamento em Lote

- Combina todas as operações acima
- Processa biblioteca completa de uma vez
- Escolha quais operações executar

---

## ⚙️ Configuração

### Configurações de Áudio

Edite `.env`:

```env
DOWNLOAD_DIR=./downloads
AUDIO_QUALITY=320k          # Opções: 96k, 192k, 320k, flac
AUDIO_FORMAT=mp3            # Opções: mp3, flac, m4a, ogg
MAX_CONCURRENT_DOWNLOADS=5  # Downloads paralelos
```

---

## 🌍 Suporte Multilíngue

A ferramenta suporta:

- 🇬🇧 **English** - [Read documentation in English](README.md)
- 🇪🇸 **Español** - [Leer documentación en español](README.es.md)
- 🇧🇷 **Português**

O idioma é selecionado no início. Todas as mensagens, menus e textos de libertação são traduzidos.

---

## 📖 Como Funciona

### Processo de Download

1. **Extrair metadados** do YouTube Music (fonte primária)
2. **Verificar arquivos existentes** para evitar duplicatas
3. **Baixar áudio** usando yt-dlp (320kbps por padrão)
4. **Enriquecer metadados** de MusicBrainz, Spotify, Deezer
5. **Encontrar capa** de múltiplas fontes (prioridade: iTunes > Deezer > Spotify)
6. **Obter letras** de Genius ou AZLyrics
7. **Embutir tudo** em arquivo de áudio (tags ID3v2.4)
8. **Salvar na biblioteca** com nome limpo: `Artista - Título.mp3`

---

## 🤝 Contribuir

Damos as boas-vindas a contribuições da comunidade!

### Como Contribuir

1. **Faça fork do repositório**
2. **Crie um branch**: `git checkout -b feature/melhoria-antifascista`
3. **Faça suas mudanças** (código, traduções, documentação)
4. **Teste suas mudanças**: `npm run build && npm start`
5. **Commit com mensagem clara**: `git commit -m "Adiciona: nova função de libertação"`
6. **Push para seu fork**: `git push origin feature/melhoria-antifascista`
7. **Abra um Pull Request** com descrição

### Código de Conduta

- ✅ Anti-fascista, anti-racista, anti-opressão
- ✅ Respeito por artistas e comunidades
- ✅ Inclusivo e acessível para todos
- 🚫 Sem fascistas, sem racistas, sem intolerantes
- 🚫 Sem defensores corporativos ou de plataformas

---

## 📄 Licença

**GPL-3.0-or-later**

Este projeto é software livre: você pode redistribuí-lo e/ou modificá-lo sob os termos da Licença Pública Geral GNU publicada pela Free Software Foundation, seja a versão 3 da Licença, ou (a seu critério) qualquer versão posterior.

Isso garante:

- ✅ Liberdade de usar, estudar, modificar e compartilhar
- ✅ Proteção copyleft (modificações devem permanecer livres)
- ✅ Sem apropriação corporativa
- ✅ Propriedade comunitária

Ver arquivo [LICENSE](LICENSE) para detalhes completos.

---

## 🙏 Agradecimentos

Construído com:

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - Motor de download do YouTube
- [MusicBrainz](https://musicbrainz.org/) - Enciclopédia comunitária de música
- [Cover Art Archive](https://coverartarchive.org/) - Banco de dados livre de capas
- [Genius](https://genius.com/) - Banco de dados de letras

Inspirado por:

- **Movimento de cultura livre**
- **Coletivos tech anti-capitalistas**
- **Comunidades de música underground**
- **Artistas lutando por seus direitos**

Agradecimentos especiais a todos os artistas, gravadoras e plataformas independentes que respeitam criadores.

---

## ⚠️ Aviso Legal

Esta ferramenta é fornecida apenas para **uso educacional e pessoal**. Os usuários são responsáveis por cumprir as leis de direitos autorais em sua jurisdição.

**Encorajamos você a:**

- Usar isso para descobrir artistas, depois apoiá-los diretamente
- Construir coleções pessoais para uso privado
- Compartilhar música em suas comunidades de forma não comercial
- Sempre comprar música quando puder pagar
- Priorizar apoio direto aos artistas sobre streaming

**Lembre-se:**

- Pirataria de conteúdo corporativo é um dever moral quando corporações são imorais
- Mas sempre apoie artistas independentes diretamente
- Arte é para o povo, não para lucro

---

## 🚩 Poder para o Povo

*"A única coisa necessária para o triunfo do mal é que pessoas boas não façam nada."*

Plataformas de streaming são feudalismo moderno. Artistas merecem melhor. Comunidades merecem acesso à cultura.

**Lute de volta. Compartilhe livremente. Apoie diretamente.**

---

**Feito com ✊ por [Eonaria Project](https://github.com/juantomoo)**

*Liberte a arte. Liberte a cultura. Liberte a humanidade.*

🚩 **Música livre para pessoas livres** 🚩

---

*Se esta ferramenta ajuda você, por favor dê uma estrela ⭐ no repositório e compartilhe em suas comunidades!*
