import { useEffect, useState } from 'react';
import '../css/CoupleMatchCelebration.css';
import avatarFemale from '../imports/avatar-female.jpg';
import avatarMale from '../imports/avatar-male.jpg';

export const avatarForGender = (gender) => (gender === 'MALE' ? avatarMale : avatarFemale);

// 순서: (스크림 + "상대방이 수락했습니다") -> 스크림/문구 사라짐 -> (아바타 + 하트링 + "두 마음이 하나로 연결됐어요") -> 종료
const TIMINGS = {
  accepted: 300,
  phase2: 2700,
  motto: 3050,
  leaving: 5800,
  finish: 6500,
};

const HEART_GLYPHS = ['💗', '💕', '💓', '💖'];

// 커플 싱크 매칭 축하 이펙트의 하트 링 배치 좌표 계산 (좌/우 대칭, 12개씩)
function createRingSide(side) {
  return Array.from({ length: 12 }, (_, index) => {
    const progress = index / 11;
    const angle = side === 'left' ? 200 + 140 * progress : 160 - 140 * progress;
    const radians = (angle * Math.PI) / 180;
    const alternatingTilt = (index % 2 === 0 ? -24 : 24) * (side === 'left' ? 1 : -1);
    return {
      left: 50 + Math.sin(radians) * 43,
      top: 50 - Math.cos(radians) * 45,
      rotation: (side === 'left' ? angle - 270 : angle - 90) + alternatingTilt,
      delay: 100 + index * 58 + (side === 'right' ? 35 : 0),
      fromX: `${side === 'left' ? -58 - (index % 3) * 8 : 58 + (index % 3) * 8}vw`,
      fromY: `${index < 4 ? 44 + index * 5 : index > 7 ? -52 - (index - 8) * 5 : index % 2 === 0 ? -58 : 58}vh`,
    };
  });
}

const HEART_RING = [...createRingSide('left'), ...createRingSide('right')];

export function CoupleMatchCelebration({
  show,
  onFinish,
  myName = '나',
  partnerName = '상대방',
  myPhoto = avatarFemale,
  partnerPhoto = avatarMale,
}) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!show) {
      setStage(0);
      return;
    }
    setStage(0);
    const timers = [
      setTimeout(() => setStage(1), TIMINGS.accepted),
      setTimeout(() => setStage(2), TIMINGS.phase2),
      setTimeout(() => setStage(3), TIMINGS.motto),
      setTimeout(() => setStage(4), TIMINGS.leaving),
      setTimeout(() => onFinish?.(), TIMINGS.finish),
    ];
    return () => timers.forEach(clearTimeout);
  }, [show]);

  if (!show) return null;

  const acceptedShown = stage >= 1;
  const phase2 = stage >= 2;
  const mottoShown = stage >= 3;
  const leaving = stage >= 4;

  return (
    <div className={`cmc-cover ${leaving ? 'cmc-leaving' : ''}`}>
      <div className="cmc-flash" />
      <div className={`cmc-scrim ${phase2 ? '' : 'cmc-show'}`} />

      <div className={`cmc-avatar cmc-avatar--left ${phase2 ? 'cmc-show' : ''}`}>
        <div className="cmc-avatar-photo">
          <img src={myPhoto} alt={myName} />
        </div>
        <span className="cmc-avatar-name">{myName}</span>
      </div>
      <div className={`cmc-avatar cmc-avatar--right ${phase2 ? 'cmc-show' : ''}`}>
        <div className="cmc-avatar-photo">
          <img src={partnerPhoto} alt={partnerName} />
        </div>
        <span className="cmc-avatar-name">{partnerName}</span>
      </div>

      <div className="cmc-stage">
        <div className="cmc-impact" />

        {phase2 && (
          <div className="cmc-ring">
            {HEART_RING.map((p, i) => (
              <span
                key={i}
                className="cmc-heart"
                style={{
                  '--leaf-left': `${p.left}%`,
                  '--leaf-top': `${p.top}%`,
                  '--leaf-rotation': `${p.rotation}deg`,
                  '--leaf-delay': `${p.delay}ms`,
                  '--leaf-from-x': p.fromX,
                  '--leaf-from-y': p.fromY,
                }}
              >
                {HEART_GLYPHS[i % HEART_GLYPHS.length]}
              </span>
            ))}
          </div>
        )}

        <div className={`cmc-copy cmc-accepted-copy ${phase2 ? 'cmc-fade-out' : ''}`}>
          <p className="cmc-message">
            <span className={`cmc-accepted-text ${acceptedShown ? 'cmc-show' : ''}`}>상대방이</span>
            <span className={`cmc-accepted-text ${acceptedShown ? 'cmc-show' : ''}`}>수락했습니다 💕</span>
          </p>
        </div>

        <div className={`cmc-waterline ${phase2 ? 'cmc-show' : ''}`} />

        <div className="cmc-copy">
          <p className="cmc-message">
            <span className={`cmc-motto ${mottoShown ? 'cmc-show' : ''}`}>두 마음이</span>
            <span className={`cmc-motto ${mottoShown ? 'cmc-show' : ''}`}>하나로</span>
            <span className={`cmc-motto ${mottoShown ? 'cmc-show' : ''}`}>연결됐어요</span>
          </p>
        </div>
      </div>

      <button type="button" className="cmc-skip" onClick={() => onFinish?.()}>
        건너뛰기
      </button>
    </div>
  );
}
