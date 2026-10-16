import { Track } from '../types/music';

// Generated asset paths
import neonCoverArt from '../assets/images/neon_cover_art_1792126925548.jpg';
import hologramBackdrop from '../assets/images/hologram_visual_backdrop_1792126926195.jpg';
import cyberDivaSilhouette from '../assets/images/cyber_diva_silhouette_1792126926712.jpg';

export { neonCoverArt, hologramBackdrop, cyberDivaSilhouette };

export const TRACK_LIST: Track[] = [
  {
    id: 'track-1',
    title: 'ネオンの欠片',
    artist: 'Virtual Cyan & Synth Resonance',
    album: 'FRAGMENTS OF NEON',
    duration: 65,
    bpm: 140,
    key: 'F#m / A Major',
    coverImage: neonCoverArt,
    genre: 'Cyber Electro-Pop',
    description: '青い光の粒子と未完成の旋律が0と1の狭間を駆け抜ける、浮遊感あふれるサイバーポップ・アンセム。',
    synthPreset: 'neon_shards',
    lyrics: [
      {
        time: 0,
        duration: 18.5,
        text: '（Instrumental Intro - 浮遊する深海のネオン）',
        romaji: 'Instrumental Intro',
        en: 'Floating deep in the neon sea'
      },
      {
        time: 19.0,
        duration: 4.5,
        text: 'ネオンの海に落ちた ワードの欠片を拾い集めて',
        romaji: 'Neon no umi ni ochita waado no kakera o hiroiatsumete',
        en: 'Gathering fragments of words fallen into the sea of neon'
      },
      {
        time: 23.5,
        duration: 5.5,
        text: '未完成のメロディーで世界を置き去りにしよう',
        romaji: 'Mikansei no merodii de sekai o okizari ni shiyou',
        en: 'Leaving the world behind with an unfinished melody'
      },
      {
        time: 29.0,
        duration: 4.5,
        text: '0と1の狭間で叫んだ声が交わり合う',
        romaji: 'Zero to ichi no hazama de sakenda koe ga majiwariau',
        en: 'Voices shouting between 0 and 1 intertwine'
      },
      {
        time: 33.5,
        duration: 4.5,
        text: '旋律息を止めて この鼓動のスピードで',
        romaji: 'Senritsu iki o tomete kono kodou no supiido de',
        en: 'Melody holding its breath, at the speed of this heartbeat'
      },
      {
        time: 38.0,
        duration: 5.0,
        text: '駆け抜けていく...',
        romaji: 'Kakenukete iku...',
        en: 'Running through the void...'
      },
      {
        time: 43.0,
        duration: 12.0,
        text: '（Holographic Drop - 結晶が砕け散る光線）',
        romaji: 'Hologram Drop',
        en: 'Crystalline shards dispersing into light beams'
      },
      {
        time: 55.0,
        duration: 10.0,
        text: '（Outro - 青の残響と粒子）',
        romaji: 'Outro',
        en: 'Blue resonance fading into starry dust'
      }
    ]
  },
  {
    id: 'track-2',
    title: '0と1の狭間',
    artist: 'Digital Horizon Unit',
    album: 'CYBERNETIC CODES',
    duration: 58,
    bpm: 132,
    key: 'Dm',
    coverImage: hologramBackdrop,
    genre: 'Future Synthwave',
    description: '重厚なサイバーサブベースと鋭利なアルペジオが、電脳空間の境界線を切り裂くインストゥルメンタル。',
    synthPreset: 'digital_horizon',
    lyrics: [
      {
        time: 0,
        duration: 15.0,
        text: '（Sub-bass Resonance - 低周波の震え）',
        romaji: 'Sub-bass build',
        en: 'Low-frequency resonance awakening'
      },
      {
        time: 15.0,
        duration: 18.0,
        text: '（Grid Alignment - 幾何学メッシュの同期）',
        romaji: 'Grid alignment',
        en: 'Geometric mesh synchronizing with pulse'
      },
      {
        time: 33.0,
        duration: 25.0,
        text: '（Peak Modulation - 0と1の奔流）',
        romaji: 'Peak modulation',
        en: 'Torrential stream of binary energy'
      }
    ]
  },
  {
    id: 'track-3',
    title: '青の浮遊 (Levitation in Blue)',
    artist: 'Prism Ambient Project',
    album: 'ZERO GRAVITY SOUNDSCAPES',
    duration: 72,
    bpm: 110,
    key: 'Am',
    coverImage: cyberDivaSilhouette,
    genre: 'Holographic Ambient',
    description: '重力を手放した光の結晶が漂う、静寂と浮遊のディープ・エレクトロニック・サウンド。',
    synthPreset: 'deep_blue_drift',
    lyrics: [
      {
        time: 0,
        duration: 20.0,
        text: '（Zero Gravity Drift - 無重力の漂流）',
        romaji: 'Zero Gravity',
        en: 'Weightless drift across sapphire tides'
      },
      {
        time: 20.0,
        duration: 25.0,
        text: '（Crystal Diffraction - プリズムの屈折）',
        romaji: 'Crystal Refraction',
        en: 'Light breaking into iridescent facets'
      },
      {
        time: 45.0,
        duration: 27.0,
        text: '（Stardust Dispersion - 静かな光の幕引き）',
        romaji: 'Dispersion',
        en: 'Stardust settling in serene darkness'
      }
    ]
  }
];
