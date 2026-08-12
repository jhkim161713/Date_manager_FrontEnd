import DefaultAvatarMale from '@/imports/DefaultAvatarMale.jpg';
import DefaultAvatarFemale from '@/imports/DefaultAvatarFemale.jpg';

// 실제 업로드 사진이 있으면 그 URL을, 없으면 성별 기본 이미지를 반환한다. gender가 'FEMALE'이
// 아닌 모든 경우(MALE은 물론, 예외적으로 남아있을 수 있는 UNKNOWN 값 포함)는 남성 기본 이미지로
// 폴백한다 - PDF에서 합의된 "UNKNOWN → 남성 기본 이미지" 규칙과 동일하게 처리.
// <img> 컴포넌트가 아니라 URL 문자열 자체가 필요한 곳(예: CoupleMatchCelebration의 photo prop)에서도
// 같은 규칙을 쓸 수 있도록 컴포넌트와 별개로 export한다.
export function avatarSrc(profileImageUrl, gender) {
  return profileImageUrl || (gender === 'FEMALE' ? DefaultAvatarFemale : DefaultAvatarMale);
}

export function Avatar({ profileImageUrl, gender, size = 36, className = '' }) {
  return (
    <img src={avatarSrc(profileImageUrl, gender)} alt="프로필 사진" width={size} height={size}
      className={`rounded-full object-cover flex-shrink-0 ${className}`}
      style={{ width: size, height: size, border: '1.5px solid #ffd6e0' }} />
  );
}
