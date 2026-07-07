// Turnuva Ağacı: 32 takımlık kura, oynanan skorlar ve oyuncunun kupa yolu.
import type { BracketMatch, TournamentBracket } from '../types';
import { SectionHeadline } from '../components/NewspaperShell';
import { tournamentRoundLabel } from '../game/tournamentEngine';
import { useGameStore } from '../store/useGameStore';

const ROUND_HEADERS = ['SON 32', 'SON 16', 'ÇEYREK FİNAL', 'YARI FİNAL', 'FİNAL'];

function MatchBox({ bracket, match }: { bracket: TournamentBracket; match: BracketMatch }) {
  const ta = bracket.teams[match.a];
  const tb = bracket.teams[match.b];
  const played = match.winner !== undefined;
  const isPlayerMatch = ta?.isPlayer || tb?.isPlayer;

  const row = (idx: number, score?: number) => {
    const team = bracket.teams[idx];
    if (!team) return null;
    const isWinner = played && match.winner === idx;
    const isLoser = played && match.winner !== idx;
    return (
      <div
        className={`flex items-center justify-between gap-1 px-1.5 py-0.5 ${
          team.isPlayer ? 'text-grass-deep' : ''
        } ${isWinner ? 'font-bold' : ''} ${isLoser ? 'opacity-50' : ''}`}
      >
        <span className="truncate text-[10px] leading-tight">
          {team.isPlayer ? '★ ' : ''}
          {team.name}
        </span>
        <span className="font-score text-[10px] shrink-0">{score !== undefined ? score : played ? '' : '·'}</span>
      </div>
    );
  };

  return (
    <div className={`border ${isPlayerMatch ? 'border-vermil border-2' : 'border-ink/25'} bg-paper-soft/40`}>
      {row(match.a, match.scoreA)}
      <div className="border-t border-ink/15" />
      {row(match.b, match.scoreB)}
      {match.penalties && (
        <div className="text-[8px] font-score uppercase tracking-wider text-ink-faint px-1.5 pb-0.5">seri penaltılar</div>
      )}
    </div>
  );
}

export function BracketScreen() {
  const run = useGameStore((s) => s.run);
  const goto = useGameStore((s) => s.goto);
  const bracket = run?.bracket;

  if (!run || run.mode !== 'tournament' || !bracket) {
    return (
      <div className="max-w-md mx-auto text-center">
        <SectionHeadline>TURNUVA AĞACI</SectionHeadline>
        <p className="text-sm italic text-ink-soft mb-4">Aktif bir turnuva kadron yok — kura çekilince ağaç burada açılır.</p>
        <button className="btn-outline w-full" onClick={() => goto('home')}>
          Geri
        </button>
      </div>
    );
  }

  const finalMatch = bracket.rounds[4]?.[0];
  const championIdx = finalMatch?.winner;

  return (
    <div className="max-w-5xl mx-auto">
      <SectionHeadline sub={`Sıradaki durak: ${tournamentRoundLabel(run.wins)}`}>🏆 TURNUVA AĞACI</SectionHeadline>

      <div className="news-card p-3 overflow-x-auto">
        <div className="flex gap-3 min-w-max items-start">
          {bracket.rounds.map((round, r) => (
            <div key={r} className="w-44 shrink-0">
              <div className="tag-label text-[9px] mb-1.5 w-full text-center">{ROUND_HEADERS[r]}</div>
              <div className="flex flex-col gap-1.5 justify-around" style={{ minHeight: '100%' }}>
                {round.length > 0 ? (
                  round.map((m, i) => <MatchBox key={i} bracket={bracket} match={m} />)
                ) : (
                  <div className="text-[10px] italic text-ink-faint text-center border border-dashed border-ink/20 py-3">
                    Kura bekleniyor
                  </div>
                )}
              </div>
            </div>
          ))}
          {/* Şampiyon kutusu */}
          <div className="w-44 shrink-0">
            <div className="tag-label text-[9px] mb-1.5 w-full text-center text-gold border-gold">ŞAMPİYON</div>
            {championIdx !== undefined ? (
              <div className="border-2 border-gold bg-gold/10 text-center py-2 px-1.5">
                <div className="text-lg">🏆</div>
                <div className="font-headline font-bold text-xs">{bracket.teams[championIdx].name}</div>
              </div>
            ) : (
              <div className="text-[10px] italic text-ink-faint text-center border border-dashed border-ink/20 py-3">
                Kupa sahibini bekliyor
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="text-[11px] italic text-ink-faint mt-2">
        ★ senin takımın · Tur atlayan takımlar güçlenir — yol finale doğru sertleşir.
      </p>

      <button className="btn-outline w-full mt-4" onClick={() => goto('home')}>
        Geri
      </button>
    </div>
  );
}
