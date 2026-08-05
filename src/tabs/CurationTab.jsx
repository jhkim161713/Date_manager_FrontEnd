import { SectionTitle } from '../components/SectionTitle';
import { ContentCard } from '../components/ContentCard';
import { CURIATION } from '../data/curationData';

export function CuriationTab() {
  return (
    <div>
      <SectionTitle sub="취향에 맞는 데이트 코스를 골라봤어요">데이트 큐레이션 🎬</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {CURIATION.map(item => (
          <ContentCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
