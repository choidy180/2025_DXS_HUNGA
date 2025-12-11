// 좌측 슬라이드바 타입
export interface SliderSection {
  title: string;
  link: string;
  sections?: SliderSection[];
}

export interface SliderItem {
  title: string;
  icon: string;
  link: string;
  sections?: SliderSection[];
}

export interface SliderExampleRoot {
  title: string;
  image: string; 
  data: SliderItem[];
}