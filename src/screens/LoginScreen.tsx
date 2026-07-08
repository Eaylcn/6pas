// Giriş vitrini: oyunu tanıtan ön sayfa — giriş/kayıt, nasıl oynanır, SSS ve canlı puan tablosu.
import { useState } from 'react';
import { t } from '../i18n';
import { SectionHeadline } from '../components/NewspaperShell';
import { useUserStore } from '../store/useUserStore';
import { useGameStore } from '../store/useGameStore';
import { isOnline } from '../services/supabaseClient';
import { tournamentRoundLabel } from '../game/tournamentEngine';

const FEATURES = [
  { icon: '🃏', title: 'Draft', text: '2025-26 gerçek kadrolarından slot slot takım kur; her seçim 3 aday arasından.' },
  { icon: '⭐', title: 'Efsane İkonlar', text: 'Maradona, Zidane, Ronaldinho, Alex, Hagi… en nadir kartlar draft masasında.' },
  { icon: '🗞️', title: 'Canlı Gazete Yayını', text: 'Maçını dakika dakika, doğal Türkçe spiker diliyle izle; gol anında sahne senin.' },
  { icon: '📣', title: 'Teknik Direktörlük', text: 'Kenara talimat: değişiklik, mevki kaydırma, taktik — yardımcı antrenör önerileriyle.' },
  { icon: '🏆', title: 'Turnuva', text: "Son 32'den finale kura ağacında kupa yolu; rakipler tur tur sertleşir." },
  { icon: '🥇', title: 'Puan Tabloları', text: 'Klasik seri ve turnuva tabloları — online modda tüm oyuncularla ortak ve canlı.' },
];

const FAQ = [
  {
    q: 'Bu oyun tam olarak ne?',
    a: '6v6 halısaha hissinde, metin tabanlı bir futbol draft oyunu. Takımını kurarsın, maçı canlı gazete yayını gibi okursun; sonuç önceden yazılmaz — her pozisyon o anda belirlenir.',
  },
  {
    q: 'Draft nasıl işliyor?',
    a: 'Her slot için sana 3 aday gelir, birini seçmek zorundasın (draft başına 1 kez yeniden çevirme hakkın var). İlk seçtiğin oyuncu kaptan olur. 6 as + 4 yedek: 1 kaleci, 1 defans, 1 orta saha, 1 atak.',
  },
  {
    q: 'Kimya ne işe yarıyor?',
    a: 'Aynı kulüpten, aynı ligden veya aynı uyruktan oyuncular birbirine bağ kurar; takım kimyası yükseldikçe sahadaki işler kolaylaşır. Mevkisi dışında oynatılan oyuncu kimyayı bozar.',
  },
  {
    q: 'Perkler ne? Neden bazı oyuncularda yok?',
    a: 'Perk, oyuncunun imza hareketidir (ör. "Ölü Köşe") ve maçta gizlice tetiklenir — sana sadece anlatımdaki muhabir notu söyler. Perkler güce göre dağılır: sıradan oyuncular çoğu zaman perksizdir, yıldızlarda 2 tane olur.',
  },
  {
    q: 'Maç sonucu önceden belli mi? Müdahalem işe yarıyor mu?',
    a: 'Hayır, belli değil. Olaylar dakika dakika üretilir; devre arasında ve maç içinde ("Kenara Talimat") yaptığın değişiklik, mevki kaydırma ve taktik ayarı kalan pozisyonları gerçekten etkiler.',
  },
  {
    q: 'Klasik mod ile Turnuva farkı ne?',
    a: 'Klasikte kaybedene kadar seri yaparsın; her galibiyet puan, seri uzadıkça bonus. Turnuvada Son 32 kura ağacından finale gidersin; kaybeden elenir, kupayı kaldıran tabloya adını yazdırır.',
  },
  {
    q: 'Skorlarım kaydoluyor mu?',
    a: 'Online sürümde hesabınla girersin; puanların, en iyi serin, turnuva aşamaların ve takım defterin hesabında saklanır. Puan tabloları tüm oyuncular için ortaktır ve canlıdır.',
  },
];

function LoginCard() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const login = useUserStore((s) => s.login);
  const register = useUserStore((s) => s.register);
  const refreshLeaderboard = useUserStore((s) => s.refreshLeaderboard);
  const goto = useGameStore((s) => s.goto);

  const canSubmit = name.trim().length >= 2 && (!isOnline || password.length >= 6) && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      if (isOnline && mode === 'register') await register(name, password);
      else await login(name, isOnline ? password : undefined);
      void refreshLeaderboard();
      goto('home');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bir şeyler ters gitti — tekrar dene.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="news-card p-5">
      <div className="tag-label mb-3">MENAJER GİRİŞİ</div>
      {isOnline && (
        <div className="flex gap-2 mb-3">
          <button
            className={`btn-outline text-xs px-3 py-1.5 flex-1 ${mode === 'login' ? 'bg-ink text-paper' : ''}`}
            onClick={() => {
              setMode('login');
              setError(null);
            }}
          >
            GİRİŞ YAP
          </button>
          <button
            className={`btn-outline text-xs px-3 py-1.5 flex-1 ${mode === 'register' ? 'bg-ink text-paper' : ''}`}
            onClick={() => {
              setMode('register');
              setError(null);
            }}
          >
            KAYIT OL
          </button>
        </div>
      )}
      <div className="space-y-3">
        <label className="block">
          <span className="tag-label mb-1.5 inline-block">{t('login.usernameLabel')}</span>
          <input
            className="field-input"
            placeholder={t('login.usernamePlaceholder')}
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </label>
        {isOnline && (
          <label className="block">
            <span className="tag-label mb-1.5 inline-block">ŞİFRE</span>
            <input
              className="field-input"
              type="password"
              placeholder="En az 6 karakter"
              value={password}
              maxLength={64}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
            {mode === 'register' && (
              <p className="text-[11px] text-ink-faint mt-1">E-posta istemiyoruz; şifreni unutma — bu sürümde kurtarma yok.</p>
            )}
          </label>
        )}
        {error && <p className="text-xs font-semibold text-vermil">{error}</p>}
        <button className="btn-press w-full" disabled={!canSubmit} onClick={submit}>
          {busy ? 'Bekle…' : isOnline && mode === 'register' ? 'Hesap Aç ve Sahaya Çık' : t('login.enter')}
        </button>
      </div>
    </div>
  );
}

function MiniBoard() {
  const { leaderboard, tournamentBoard } = useUserStore();
  const [tab, setTab] = useState<'classic' | 'tournament'>('classic');
  const entries = (tab === 'classic' ? leaderboard : tournamentBoard).slice(0, 5);

  return (
    <div className="news-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="tag-label">{isOnline ? '🌐 CANLI PUAN TABLOSU' : 'PUAN TABLOSU'}</span>
        <div className="flex gap-1">
          <button
            className={`text-[10px] font-score uppercase px-2 py-0.5 border border-ink/40 ${tab === 'classic' ? 'bg-ink text-paper' : ''}`}
            onClick={() => setTab('classic')}
          >
            KLASİK
          </button>
          <button
            className={`text-[10px] font-score uppercase px-2 py-0.5 border border-ink/40 ${tab === 'tournament' ? 'bg-ink text-paper' : ''}`}
            onClick={() => setTab('tournament')}
          >
            🏆 TURNUVA
          </button>
        </div>
      </div>
      {entries.length > 0 ? (
        <div className="space-y-1">
          {entries.map((e, i) => (
            <div key={e.userId} className="flex items-center gap-2 text-sm border-b border-ink/10 pb-1">
              <span className="font-score font-bold w-5 text-center">{i + 1}</span>
              <span className="truncate flex-1">{e.username}</span>
              {tab === 'tournament' && (e.bestStage ?? 0) > 0 && (
                <span className="text-[9px] font-score uppercase text-ink-soft shrink-0">
                  {(e.bestStage ?? 0) >= 5 ? '🏆' : tournamentRoundLabel(e.bestStage ?? 0)}
                </span>
              )}
              <span className="font-score font-bold shrink-0">{e.totalPoints}p</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs italic text-ink-faint">Tablo henüz boş — ilk maçı sen kazan, adını ilk sen yazdır.</p>
      )}
    </div>
  );
}

export function LoginScreen() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Manşet */}
      <div className="text-center mb-6">
        <SectionHeadline sub="Takımını draft et, maçını gazete yayını gibi izle, kupaya uzan.">
          HALISAHANIN DRAFT GAZETESİ
        </SectionHeadline>
        <p className="text-[11px] font-score uppercase tracking-widest text-ink-faint -mt-2">
          ⭐ 2025-26 gerçek kadroları + efsane ikonlar{isOnline && ' · 🌐 canlı puan tabloları'}
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-5 items-start">
        {/* Sol: tanıtım + SSS */}
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-2.5">
            {FEATURES.map((f) => (
              <div key={f.title} className="news-card p-3">
                <div className="font-headline font-bold text-sm mb-0.5">
                  {f.icon} {f.title}
                </div>
                <p className="text-xs text-ink-soft leading-snug">{f.text}</p>
              </div>
            ))}
          </div>

          {/* Nasıl oynanır */}
          <div className="news-card p-4">
            <div className="tag-label mb-2">NASIL OYNANIR?</div>
            <ol className="text-sm space-y-1.5 list-none">
              {[
                'Mod seç: 📰 Klasik seri ya da 🏆 Son 32 turnuvası.',
                'Takımını draft et: her slot için 3 aday, ilk seçim kaptan.',
                'Taktiğini kur, maçı canlı yayında izle; gerekirse kenara talimat ver.',
                'Kazandıkça puan topla; tabloda ve takım defterinde adını büyüt.',
              ].map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-score font-bold text-vermil shrink-0">{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* SSS */}
          <div className="news-card p-4">
            <div className="tag-label mb-2">SIKÇA SORULAN SORULAR</div>
            <div className="divide-y divide-ink/15">
              {FAQ.map((f, i) => (
                <div key={i} className="py-1.5">
                  <button
                    className="w-full text-left flex items-center justify-between gap-2 text-sm font-semibold hover:text-vermil"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    {f.q}
                    <span className="font-score text-ink-faint shrink-0">{openFaq === i ? '−' : '+'}</span>
                  </button>
                  {openFaq === i && <p className="text-[13px] text-ink-soft leading-relaxed mt-1">{f.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sağ: giriş + canlı tablo */}
        <div className="space-y-4 md:sticky md:top-4">
          <LoginCard />
          <MiniBoard />
        </div>
      </div>
    </div>
  );
}
