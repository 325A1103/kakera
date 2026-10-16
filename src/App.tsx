import React, { useState, useEffect, useCallback } from 'react';
import { TRACK_LIST } from './data/tracks';
import { Track, VisualizerConfig, StemControls } from './types/music';
import { synthEngine } from './audio/synthEngine';
import { Header } from './components/Header';
import { HologramCanvas } from './components/HologramCanvas';
import { PlayerControls } from './components/PlayerControls';
import { LyricsDisplay } from './components/LyricsDisplay';
import { StemMixer } from './components/StemMixer';
import { TrackList } from './components/TrackList';
import { ConceptStory } from './components/ConceptStory';
import { Footer } from './components/Footer';
import {
  Sparkles,
  Sliders,
  FileAudio,
  Radio,
  Layers,
  HelpCircle,
  X,
  Volume2,
} from 'lucide-react';

export default function App() {
  const [tracks, setTracks] = useState<Track[]>(TRACK_LIST);
  const [currentTrack, setCurrentTrack] = useState<Track>(TRACK_LIST[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(TRACK_LIST[0].duration);
  const [volume, setVolume] = useState<number>(0.85);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);

  // Hologram visualizer config
  const [visualizerConfig, setVisualizerConfig] = useState<VisualizerConfig>({
    mode: 'shards',
    glowIntensity: 1.1,
    floatSpeed: 1.0,
    particleDensity: 120,
    showScanlines: true,
    chromaticAberration: true,
    sensitivity: 1.3,
  });

  // Stems
  const [stems, setStems] = useState<StemControls>(synthEngine.getStems());

  // Setup synthEngine listeners
  useEffect(() => {
    synthEngine.setTrack(currentTrack);

    synthEngine.onTimeUpdate((time, dur) => {
      setCurrentTime(time);
      setDuration(dur);
    });

    synthEngine.onTrackEnded(() => {
      if (isLooping) {
        synthEngine.seek(0);
        synthEngine.play();
      } else {
        handleNextTrack();
      }
    });
  }, []);

  // Update track change
  const handleSelectTrack = useCallback((track: Track) => {
    setCurrentTrack(track);
    synthEngine.setTrack(track);
    setDuration(track.duration);
    setCurrentTime(0);
    if (isPlaying) {
      synthEngine.play();
    }
  }, [isPlaying]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      synthEngine.pause();
      setIsPlaying(false);
    } else {
      synthEngine.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleSeek = useCallback((seconds: number) => {
    synthEngine.seek(seconds);
    setCurrentTime(seconds);
  }, []);

  const handleNextTrack = useCallback(() => {
    const currentIdx = tracks.findIndex(t => t.id === currentTrack.id);
    let nextIdx: number;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * tracks.length);
    } else {
      nextIdx = (currentIdx + 1) % tracks.length;
    }
    handleSelectTrack(tracks[nextIdx]);
  }, [tracks, currentTrack, isShuffle, handleSelectTrack]);

  const handlePrevTrack = useCallback(() => {
    if (currentTime > 3) {
      handleSeek(0);
      return;
    }
    const currentIdx = tracks.findIndex(t => t.id === currentTrack.id);
    const prevIdx = (currentIdx - 1 + tracks.length) % tracks.length;
    handleSelectTrack(tracks[prevIdx]);
  }, [currentTime, tracks, currentTrack, handleSelectTrack, handleSeek]);

  const handleVolumeChange = useCallback((newVol: number) => {
    setVolume(newVol);
    synthEngine.setMasterVolume(newVol);
  }, []);

  // Stem Controls
  const handleUpdateStem = (
    stemKey: keyof Omit<StemControls, 'filterCutoff' | 'reverbAmount'>,
    updates: Partial<{ volume: number; muted: boolean; solo: boolean }>
  ) => {
    synthEngine.updateStem(stemKey, updates);
    setStems(synthEngine.getStems());
  };

  const handleFilterCutoffChange = (hz: number) => {
    synthEngine.setFilterCutoff(hz);
    setStems(prev => ({ ...prev, filterCutoff: hz }));
  };

  const handleResetStems = () => {
    const defaultStems: StemControls = {
      lead: { volume: 0.85, muted: false, solo: false },
      bass: { volume: 0.8, muted: false, solo: false },
      arp: { volume: 0.75, muted: false, solo: false },
      pad: { volume: 0.7, muted: false, solo: false },
      drums: { volume: 0.85, muted: false, solo: false },
      filterCutoff: 14000,
      reverbAmount: 0.35,
    };
    Object.keys(defaultStems).forEach(k => {
      if (k === 'filterCutoff') synthEngine.setFilterCutoff(14000);
      else if (k !== 'reverbAmount') {
        synthEngine.updateStem(k as any, defaultStems[k as keyof typeof defaultStems] as any);
      }
    });
    setStems(defaultStems);
  };

  // Custom File Upload
  const handleFileUpload = async (file: File) => {
    try {
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      await synthEngine.loadExternalAudio(file);

      const customTrack: Track = {
        id: `custom-${Date.now()}`,
        title: fileName,
        artist: 'User Imported Audio',
        album: 'Holographic Session',
        duration: synthEngine.getDuration(),
        bpm: 130,
        key: 'Custom',
        coverImage: currentTrack.coverImage,
        genre: 'User Audio File',
        description: `ユーザーが読み込んだ音声ファイル: ${file.name}。ホログラムビジュアライザーでリアルタイム波形解析が行われます。`,
        lyrics: [
          {
            time: 0,
            duration: synthEngine.getDuration() || 180,
            text: `[外部音源再生中: ${file.name}]`,
            romaji: 'Playing uploaded audio file',
            en: 'Holographic spectral analysis active'
          }
        ],
        synthPreset: 'custom',
        isCustom: true,
      };

      setTracks(prev => [customTrack, ...prev]);
      setCurrentTrack(customTrack);
      setIsPlaying(true);
      synthEngine.play();
    } catch (err) {
      console.error('File load error', err);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
        handleFileUpload(file);
      }
    }
  };

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSeek(currentTime + 5);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSeek(Math.max(0, currentTime - 5));
      } else if (e.key.toLowerCase() === 'm') {
        handleVolumeChange(volume === 0 ? 0.85 : 0);
      } else if (e.key === '1') {
        setVisualizerConfig(p => ({ ...p, mode: 'shards' }));
      } else if (e.key === '2') {
        setVisualizerConfig(p => ({ ...p, mode: 'orbital' }));
      } else if (e.key === '3') {
        setVisualizerConfig(p => ({ ...p, mode: 'cybermesh' }));
      } else if (e.key === '4') {
        setVisualizerConfig(p => ({ ...p, mode: 'particles' }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, handleSeek, currentTime, volume, handleVolumeChange]);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="min-h-screen bg-[#030712] text-slate-100 flex flex-col relative"
    >
      {/* Drag & Drop Overlay */}
      {isDraggingFile && (
        <div className="fixed inset-0 z-50 bg-cyan-950/85 backdrop-blur-xl border-4 border-dashed border-cyan-400 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
          <FileAudio className="w-16 h-16 text-cyan-300 animate-bounce mb-4" />
          <h2 className="text-2xl font-bold text-white">ここに音声ファイルをドロップ</h2>
          <p className="text-sm text-cyan-200 mt-2">
            MP3, WAV, M4A などの楽曲を読み込み、3Dホログラム空間で即座に解析再生します
          </p>
        </div>
      )}

      {/* Top Header */}
      <Header
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onNavigate={scrollToSection}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-10" id="top">
        {/* Hero Section: Title & 3D Holographic Stage */}
        <section id="visualizer" className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>HOLOGRAPHIC MUSIC EMITTER // NEON NO KAKERA</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                ネオンの欠片
              </h1>
              <p className="text-sm md:text-base text-slate-300 mt-1 max-w-2xl">
                ダークブルーの深淵に浮かぶホログラムと、周波数に共鳴する光の幾何学結晶。
              </p>
            </div>

            {/* Quick Tuning Trigger */}
            <div className="flex items-center gap-2 self-start md:self-end">
              <button
                onClick={() => setShowConfigModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-cyan-500/20 transition-all"
                title="Tuning settings for hologram"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>ホログラム詳細設定</span>
              </button>
            </div>
          </div>

          {/* Hologram Stage */}
          <HologramCanvas
            config={visualizerConfig}
            onUpdateConfig={updates => setVisualizerConfig(p => ({ ...p, ...updates }))}
            isPlaying={isPlaying}
            trackTitle={currentTrack.title}
          />
        </section>

        {/* Player Transport Controls */}
        <section id="player" className="scroll-mt-24">
          <PlayerControls
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            isLooping={isLooping}
            isShuffle={isShuffle}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            onPrevTrack={handlePrevTrack}
            onNextTrack={handleNextTrack}
            onVolumeChange={handleVolumeChange}
            onToggleLoop={() => setIsLooping(!isLooping)}
            onToggleShuffle={() => setIsShuffle(!isShuffle)}
            onFileUpload={handleFileUpload}
          />
        </section>

        {/* Side-by-Side: Lyrics Synchronizer & Stem Mixer */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Synchronized Lyrics */}
          <div id="lyrics" className="lg:col-span-5 scroll-mt-24">
            <LyricsDisplay
              lyrics={currentTrack.lyrics}
              currentTime={currentTime}
              onSeek={handleSeek}
              trackTitle={currentTrack.title}
            />
          </div>

          {/* Right: Sound Matrix & Stem Mixer */}
          <div id="mixer" className="lg:col-span-7 scroll-mt-24">
            <StemMixer
              stems={stems}
              onUpdateStem={handleUpdateStem}
              onFilterCutoffChange={handleFilterCutoffChange}
              onResetStems={handleResetStems}
              isPlaying={isPlaying}
            />
          </div>
        </section>

        {/* Track Collection */}
        <section id="tracklist" className="scroll-mt-24">
          <TrackList
            tracks={tracks}
            currentTrackId={currentTrack.id}
            isPlaying={isPlaying}
            onSelectTrack={handleSelectTrack}
          />
        </section>

        {/* Concept Lore & Story */}
        <section id="about" className="scroll-mt-24 pt-4">
          <ConceptStory />
        </section>
      </main>

      {/* Hologram Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.25)] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-base font-semibold text-white">ホログラム投影パラメーター</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Sensitivity */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>周波数感度 (Audio Reactivity)</span>
                  <span className="font-mono text-cyan-400">{visualizerConfig.sensitivity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.5}
                  step={0.1}
                  value={visualizerConfig.sensitivity}
                  onChange={e =>
                    setVisualizerConfig(p => ({ ...p, sensitivity: parseFloat(e.target.value) }))
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Glow Intensity */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>ネオン発光強度 (Glow Intensity)</span>
                  <span className="font-mono text-cyan-400">{visualizerConfig.glowIntensity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0.4}
                  max={2.0}
                  step={0.1}
                  value={visualizerConfig.glowIntensity}
                  onChange={e =>
                    setVisualizerConfig(p => ({ ...p, glowIntensity: parseFloat(e.target.value) }))
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Floating Speed */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>無重力浮遊速度 (Floating Drift Speed)</span>
                  <span className="font-mono text-cyan-400">{visualizerConfig.floatSpeed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0.3}
                  max={2.5}
                  step={0.1}
                  value={visualizerConfig.floatSpeed}
                  onChange={e =>
                    setVisualizerConfig(p => ({ ...p, floatSpeed: parseFloat(e.target.value) }))
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">CRTスキャンライン</span>
                <button
                  onClick={() =>
                    setVisualizerConfig(p => ({ ...p, showScanlines: !p.showScanlines }))
                  }
                  className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                    visualizerConfig.showScanlines
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {visualizerConfig.showScanlines ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowConfigModal(false)}
              className="w-full py-2 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            >
              設定を適用
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer onNavigate={scrollToSection} />
    </div>
  );
}
