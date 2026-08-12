import DefaultAvatarMale from '@/imports/DefaultAvatarMale.jpg';
import DefaultAvatarFemale from '@/imports/DefaultAvatarFemale.jpg';

// 프로필 사진이 없으면 성별 기본 이미지로 대체한다. gender가 'FEMALE'이 아닌 모든 경우
// (MALE은 물론, 예외적으로 남아있을 수 있는 UNKNOWN 값 포함)는 남성 기본 이미지로 폴백한다 -
// PDF에서 합의된 "UNKNOWN → 남성 기본 이미지" 규칙과 동일하게 처리.
export function Avatar({ profileImageUrl, gender, size = 36, className = '' }) {
  const fallback = gender === 'FEMALE' ? DefaultAvatarFemale : DefaultAvatarMale;
  return (
    <img src={profileImageUrl || fallback} alt="프로필 사진" width={size} height={size}
      className={`rounded-full object-cover flex-shrink-0 ${className}`}
      style={{ width: size, height: size, border: '1.5px solid #ffd6e0' }} />
  );
}
