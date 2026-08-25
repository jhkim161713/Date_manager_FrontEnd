import { SectionTitle } from '../components/SectionTitle';
import { avatarSrc } from '../components/Avatar';
import { CoupleMatchCelebration } from '../components/CoupleMatchCelebration';
import { ConnectionHeroText } from '../components/couple/ConnectionHeroText';
import { ConnectionCard } from '../components/couple/ConnectionCard';
import { CompatibilitySection } from '../components/couple/CompatibilitySection';
import { InviteLinkPanel } from '../components/couple/InviteLinkPanel';
import { ConnectionStepsAside } from '../components/couple/ConnectionStepsAside';
import { COUPLE_SINK_COPY } from '../data/coupleSink';
import { useCoupleConnection } from '../hooks/useCoupleConnection';

const opposite = (gender) => (gender === 'MALE' ? 'FEMALE' : 'MALE');

export function CoupleTab({ user, onTabChange, personaProfile }) {
  const {
    status, daysTogether, milestone,
    feedback, showMatchCelebration, setShowMatchCelebration,
    inviteLink, creatingInvite, makeInviteLink, copyInviteLink, shareInviteLink,
    acceptToken, setAcceptToken, accepting, handleAcceptInvite,
    handleDisconnect, handleAckAdminReconnect,
    metDateInput, setMetDateInput, metDateSaving, metDateError,
    isEditingMetDate, setIsEditingMetDate, handleSaveMetDate, cancelEditMetDate,
  } = useCoupleConnection();

  return (
    <div className="space-y-5 pb-8">
      <div className="px-3">
        <SectionTitle sub={COUPLE_SINK_COPY.subtitle}>💞 내 파트너 링크</SectionTitle>
      </div>

      <section
        className="relative overflow-hidden rounded-[28px] px-6 py-7 md:px-9 md:py-8"
        style={{
          background: 'linear-gradient(125deg, #fff1ed 0%, #fff8f4 46%, #f7efff 100%)',
          border: '1.5px solid #ffd6e0',
          boxShadow: '0 12px 30px rgba(127, 76, 92, 0.08)',
        }}
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full" style={{ background: 'rgba(232, 213, 245, 0.62)' }} />
        <div className="pointer-events-none absolute -bottom-20 left-[34%] h-44 w-44 rounded-full" style={{ background: 'rgba(255, 214, 224, 0.38)' }} />

        <div className="relative z-10 grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <ConnectionHeroText
              status={status}
              daysTogether={daysTogether}
              milestone={milestone}
              creatingInvite={creatingInvite}
              inviteLink={inviteLink}
              onMakeInviteLink={makeInviteLink}
              onGoBuilder={() => onTabChange?.('builder')}
            />
          </div>

          <ConnectionCard
            user={user}
            status={status}
            metDateInput={metDateInput}
            setMetDateInput={setMetDateInput}
            metDateSaving={metDateSaving}
            metDateError={metDateError}
            isEditingMetDate={isEditingMetDate}
            setIsEditingMetDate={setIsEditingMetDate}
            onSaveMetDate={handleSaveMetDate}
            onCancelEditMetDate={cancelEditMetDate}
            onDisconnect={handleDisconnect}
            onAckAdminReconnect={handleAckAdminReconnect}
          />
        </div>
      </section>

      {status.linked && (
        <CompatibilitySection user={user} partner={status.partner} personaProfile={personaProfile} />
      )}

      {!status.linked && (
        <section className="grid gap-4 xl:grid-cols-[1fr_300px]">
          <InviteLinkPanel
            inviteLink={inviteLink}
            onCopyInviteLink={copyInviteLink}
            onShareInviteLink={shareInviteLink}
            acceptToken={acceptToken}
            setAcceptToken={setAcceptToken}
            accepting={accepting}
            onAcceptInvite={handleAcceptInvite}
          />
          <ConnectionStepsAside />
        </section>
      )}

      <div
        aria-live="polite"
        className={`fixed bottom-7 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-xs font-extrabold text-white shadow-lg transition-all ${feedback ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}
        style={{ background: '#4f3d46' }}
      >
        ✓ {feedback}
      </div>

      <CoupleMatchCelebration
        show={showMatchCelebration}
        onFinish={() => setShowMatchCelebration(false)}
        myName={user?.nickname || '나'}
        partnerName={status.partner?.nickname || '상대방'}
        myPhoto={avatarSrc(user?.profileImageUrl, user?.gender)}
        partnerPhoto={avatarSrc(status.partner?.profileImageUrl, status.partner?.gender || opposite(user?.gender))}
      />
    </div>
  );
}
