// Kariyer modu: galibiyet sonrası takviye. Oyuncu bir mevki seçer,
// o mevkiye üst seviye bir oyuncu gelir, en zayıf oyuncu kadrodan ayrılır.
import { useMemo, useState } from 'react';
import type { FieldPosition, Position } from '../types';
import { isGoalkeeper } from '../types';
import { t } from '../i18n';
import { SectionHeadline } from '../components/NewspaperShell';
import { getPlayer } from '../data';
import { pickReinforcement } from '../game/careerEngine';
import { createRng, randomSeed } from '../utils/random';
import { useGameStore } from '../store/useGameStore';

const POSITIONS: Position[] = ['GK', 'DEF', 'MID', 'ATK'];

export function ReinforcementScreen() {
  const { run, applyReinforcement, skipReinforcement, goto } = useGameStore();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  // Her mevkinin şu anki en zayıf oyuncusu — takviye vitrininde referans
  const weakestByPos = useMemo(() => {
    const map: Partial<Record<Position, { name: string; ovr: number }>> = {};
    if (!run) return map;
    const ids = [...run.squad, ...run.bench].filter((s) => s.playerId).map((s) => s.playerId!);
    for (const pos of POSITIONS) {
      const atPos = ids
        .map((id) => {
          try {
            return getPlayer(id);
          } catch {
            return null;
          }
        })
        .filter((p): p is NonNullable<typeof p> => p !== null && p.position === pos);
      if (atPos.length > 0) {
        const weak = atPos.reduce((a, b) => (b.ovr < a.ovr ? b : a));
        map[pos] = { name: weak.name, ovr: weak.ovr };
      }
    }
    return map;
  }, [run]);

  // Bir mevkiye gelecek takviyenin tahmini gücü (önizleme)
  const previewFor = (pos: Position): number | null => {
    if (!run) return null;
    const ids = [...run.squad, ...run.bench].filter((s) => s.playerId).map((s) => s.playerId!);
    const rng = createRng(randomSeed() + pos.charCodeAt(0));
    const r = pickReinforcement(rng, ids, pos, run.wins);
    return r ? r.incoming.ovr : null;
  };

  if (!run) return null;

  const pick = async (pos: Position) => {
    setBusy(true);
    const res = await applyReinforcement(pos);
    setBusy(false);
    if (res.error) setDone(res.error);
    else if (res.summary) setDone(res.summary);
  };

  return (
    <div className="max-w-lg mx-auto">
      <SectionHeadline sub={`${run.teamName} · ${run.wins}. galibiyet`}>💪 TAKVİYE ZAMANI</SectionHeadline>

      {done ? (
        <div className="news-card p-5 text-center">
          <div className="text-4xl mb-2">🤝</div>
          <p className="text-sm font-semibold mb-4">{done}</p>
          <button className="btn-press w-full" onClick={() => goto('squad-review')}>
            Kadroyu İncele
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-ink-soft mb-4">
            Galibiyet transfer bütçesi getirdi! Bir mevki seç — o bölgeye daha güçlü bir isim katılsın, en zayıf
            oyuncun takımdan ayrılsın. Kadron kalıcı; kaybetsen de dağılmaz.
          </p>
          <div className="space-y-2">
            {POSITIONS.map((pos) => {
              const weak = weakestByPos[pos];
              const preview = previewFor(pos);
              const gain = weak && preview ? preview - weak.ovr : null;
              return (
                <button
                  key={pos}
                  disabled={busy || !weak || preview === null}
                  className="news-card-clickable w-full p-4 text-left flex items-center gap-3 disabled:opacity-50"
                  onClick={() => pick(pos as FieldPosition | 'GK')}
                >
                  <div className="font-headline font-bold text-lg w-14 shrink-0">{t(`position.${pos}`)}</div>
                  <div className="flex-1 min-w-0">
                    {weak ? (
                      <p className="text-xs text-ink-soft">
                        Ayrılacak: <b>{weak.name}</b> ({weak.ovr})
                      </p>
                    ) : (
                      <p className="text-xs text-ink-faint italic">Bu mevkide oyuncu yok</p>
                    )}
                    {preview !== null && (
                      <p className="text-xs text-grass-deep font-semibold">
                        Gelecek takviye ≈ {preview} OVR {gain && gain > 0 ? `(+${gain})` : ''}
                      </p>
                    )}
                  </div>
                  <span className="text-2xl shrink-0">⬆️</span>
                </button>
              );
            })}
          </div>
          <button className="btn-outline w-full mt-4" disabled={busy} onClick={() => { skipReinforcement(); goto('squad-review'); }}>
            Bu turu atla (kadroyu koru)
          </button>
        </>
      )}
    </div>
  );
}
