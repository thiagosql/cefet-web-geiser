import express from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = 3000;
const db = {};

// Carregar banco de dados
db.jogadores = JSON.parse(readFileSync(path.join(__dirname, 'data/jogadores.json'), 'utf-8'));
db.jogosPorJogador = JSON.parse(readFileSync(path.join(__dirname, 'data/jogosPorJogador.json'), 'utf-8'));

const app = express();

// Configurar templating engine (Handlebars)
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// EXERCÍCIO 1 - Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../client')));

// EXERCÍCIO 2 - Página inicial
app.get('/', (req, res) => {
  res.render('index', { players: db.jogadores.players });
});

// EXERCÍCIO 3 - Página do jogador
app.get('/jogador/:id/', (req, res) => {
  const id = req.params.id;

  const jogador = db.jogadores.players.find(p => p.steamid === id);
  if (!jogador) {
    return res.status(404).send('Jogador não encontrado');
  }

  const dadosJogador = db.jogosPorJogador[id];
  const jogos = dadosJogador ? dadosJogador.games : [];

  // Ordenar jogos por playtime_forever (decrescente) e pegar top 5
  const jogosOrdenados = [...jogos].sort((a, b) => b.playtime_forever - a.playtime_forever);
  const top5 = jogosOrdenados.slice(0, 5);

  // Jogo favorito (primeiro da lista ordenada)
  const jogoFavorito = jogosOrdenados[0] || null;

  // Campos calculados
  const quantidadeJogos = dadosJogador ? dadosJogador.game_count : 0;
  const naoJogados = jogos.filter(j => j.playtime_forever === 0).length;

  // Montar URL das imagens dos jogos
  const top5ComImagem = top5.map(j => ({
    ...j,
    imgUrl: `http://media.steampowered.com/steamcommunity/public/images/apps/${j.appid}/${j.img_logo_url}.jpg`,
    horasJogadas: Math.round(j.playtime_forever / 60) + 'h'
  }));

  const jogoFavoritoFormatado = jogoFavorito ? {
    ...jogoFavorito,
    imgUrl: `http://media.steampowered.com/steamcommunity/public/images/apps/${jogoFavorito.appid}/${jogoFavorito.img_logo_url}.jpg`,
    horasJogadas: Math.round(jogoFavorito.playtime_forever / 60) + 'h',
    statsUrl: `http://steamcommunity.com/profiles/${id}/stats/${jogoFavorito.appid}`
  } : null;

  res.render('jogador', {
    jogador,
    jogoFavorito: jogoFavoritoFormatado,
    top5: top5ComImagem,
    quantidadeJogos,
    naoJogados
  });
});

// Abrir servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});