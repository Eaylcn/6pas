// Kariyer modu: galibiyet sonrası takviye. Oyuncu bir mevki seçer,
// o mevkiye üst seviye bir oyuncu gelir, en zayıf oyuncu kadrodan ayrılır.
import { useMemo, useState } from 'react';
import type { FieldPosition, Position } from '../types';
import { isGoalkeeper } from '../types';
import { t } from '../i18n';
import { SectionHeadline } from '../components/NewspaperShell';
import { pickReinforcement, reinforcementOutgoing } from '../game/careerEngine';
import { createRng, randomSeed } from '../utils/random';
import { useGameStore } from '../store/useGameStore';

const POSITIONS: Position[] = ['GK', 'DEF', 'MID', 'ATK'];

export function ReinforcementScreen() {
  const { run, applyReinforcement, skipReinforcement, goto } = useGameStore();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  // Her mevkide değişecek oyuncu (önce ilk 11) + gelecek takviyenin gücü
  const infoByPos = useMemo(() => {
    const map: Partial<Record<Position, { name: string; ovr: number; starter: boolean; incoming: number | null }>> = {};
    if (!run) return map;
    const starterIds = run.squad.filter((s) => s.playerId).map((s) => s.playerId!);
    const benchIds = run.bench.filter((b) => b.playerId).map((b) => b.playerId!);
    for (const pos of POSITIONS) {
      const out = reinforcementOutgoing(starterIds, benchIds, pos);
      if (!out) continue;
      const rng = createRng(randomSeed() + pos.charCodeAt(0));
      const r = pickReinforcement(rng, starterIds, benchIds, pos, run.wins);
      map[pos] = { name: out.player.name, ovr: out.player.ovr, starter: out.isStarter, incoming: r ? r.incoming.ovr : null };
    }
    return map;
  }, [run]);

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
              const info = infoByPos[pos];
              const gain = info && info.incoming ? info.incoming - info.ovr : null;
              return (
                <button
                  key={pos}
                  disabled={busy || !info || info.incoming === null}
                  className="news-card-clickable w-full p-4 text-left flex items-center gap-3 disabled:opacity-50"
                  onClick={() => pick(pos as FieldPosition | 'GK')}
                >
                  <div className="font-headline font-bold text-lg w-14 shrink-0">{t(`position.${pos}`)}</div>
                  <div className="flex-1 min-w-0">
                    {info ? (
                      <p className="text-xs text-ink-soft">
                        Ayrılacak: <b>{info.name}</b> ({info.ovr}){' '}
                        <span className="text-[10px] font-score uppercase tracking-wide text-ink-faint">
                          {info.starter ? '· ilk 11' : '· kulübe'}
                        </span>
                      </p>
                    ) : (
                      <p className="text-xs text-ink-faint italic">Bu mevkide oyuncu yok</p>
                    )}
                    {info?.incoming != null && (
                      <p className="text-xs text-grass-deep font-semibold">
                        Gelecek takviye ≈ {info.incoming} OVR {gain && gain > 0 ? `(+${gain})` : ''}
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
