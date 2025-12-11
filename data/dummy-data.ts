// dummyData.ts

// 50개 컬럼의 헤더 정의
export const COLUMN_HEADERS = [
  // 기본 컬럼 (10개)
  '날짜', '시험명', '시험작업자', '비고', 'No', '단위', 
  // 1M ~ 9M
  '1(M)', '2(M)', '3(M)', '4(M)', '5(M)', '6(M)', '7(M)', '8(M)', '9(M)', 
  '최종', // 17개
  
  // 추가 컬럼 33개 (C18 ~ C50)
  ...Array.from({ length: 33 }, (_, i) => `C${i + 18}`),
];

// 94개 Row의 더미 데이터 생성
const createDummyData = () => {
  const data = [];
  const totalRows = 94; // 요청된 세로 최대 94개

  for (let i = 0; i < totalRows; i++) {
    const row: { [key: string]: any } = {};
    // 날짜 조회를 위해 2025년 8월 데이터를 포함하도록 날짜를 설정
    const baseDate = `2025-08-${String(i % 30 + 1).padStart(2, '0')}`;
    const workName = `040212 작업제(${i + 1})`;

    row['날짜'] = baseDate;
    row['시험명'] = `2004.12.11`;
    row['시험작업자'] = `D(글로즈아황산염) ${i % 3 + 1}`;
    row['비고'] = `비고${i % 5 + 1}`;
    row['No'] = i + 1;
    row['단위'] = 'Phr';

    // 1(M) ~ 9(M) 및 최종 값 설정
    row['1(M)'] = i % 50 + 100;
    for (let j = 2; j <= 9; j++) {
      row[`${j}(M)`] = i % 10 + 5;
    }
    row['최종'] = 2024;

    // 추가 컬럼 C18 ~ C50 값 설정
    for (let k = 18; k <= 50; k++) {
      row[`C${k}`] = (i + k) % 20 + 1;
    }
    
    data.push(row);
  }
  return data;
};

export const DUMMY_DATA = createDummyData();