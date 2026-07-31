export type Tab = 
  | 'home' 
  | 'couple'
  | 'curiation' 
  | 'builder' 
  | 'calendar' 
  | 'magazine' 
  | 'judge' 
  | 'tarot' 
  | 'tendency';


export interface CurationCard {
  id: number
  title: string
  subtitle: string
  tag: string
  tagColor: string
  tagBg: string
  match: number
  img: string
  location?: string
  price?: string
}
