import styled from "styled-components";

export const PageWrap = styled.main`
  width: 100%;
  height: auto;
  min-height: 100vh;
  padding: 12px;
  background: var(--background-mainbase-100, #f7f8fa);
  font-family: 'Pretendard';
  position: relative;
  /* ... 나머지 스타일 ... */
`;

export const TopGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: stretch;
  width: 100%;
  height: auto;
  @media (max-width: 1280px) { grid-template-columns: 1fr; }
`;

export const BottomGrid = styled.div`
  position: relative;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
  height: auto;

  & > * { min-width: 0; }

  @media (max-width: 1280px) {
    grid-template-columns: 1fr;
  }
`;

export const Card = styled.section`
  width: 100%;
  height: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin-bottom: 30px;

  background: #fff;
  border: 1px solid #CACADE;
  border-radius: 8px;
  padding: 35px;
  box-sizing: border-box;

  .left-right {
    width: 100%;
    text-align: center;
    margin-top: 15px;
    font-size: 1.15rem;
    color: var(--text-neutral-medium);
  }
`;

export const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  height: 40px;

  h3 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 700;
    letter-spacing: -0.5px;
  }
`;

export const AddBtn = styled.button`
  border-radius: 6px;
  padding: 6px 10px;
  font-weight: 600;
  background-color: var(--background-gray-200);
`;

export const CaseGrid = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 20px;
  min-width: 0;
  align-items: stretch; /* ✅ 내부 카드 높이 동기화 */
`;

export const CaseBox = styled.div`
  background-color: var(--background-gray-100);
  border: 1px solid #CACADE;
  border-radius: 8px;
  width: 100%;
  padding: 20px;
  flex-shrink: 0;
  
  /* ✅ [수정] 고정 높이 제거, 내용물에 따라 늘어나되 100% 채움 */
  min-height: 300px; 
  height: 100%; 
  /* max-height 제거됨 */
  
  transition: width 0.3s ease-in-out;
  &.mutiple {
    width: calc(50% - 11px);
  }
  
  display: flex;
  flex-direction: column;
`;

export const CaseHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  span {
    font-size: 1.2rem;
    font-weight: 500;
  }
  .actions {
    display: inline-flex;
    gap: 0px;
  }
  button {
    width: 30px;
    height: 30px;
    padding: 4px 6px;
    border-radius: 6px;
    transform: scale(1.1);
  }
`;

export const Inputs = styled.div`
  background: #fff;
  border-radius: 6px;
  padding: 8px;
  border: 1px solid #CACADE;
  
  /* ✅ [수정] 12개 정도의 높이(약 580px)까지만 늘어나고 그 후엔 스크롤 */
  max-height: 580px;
  overflow-y: auto;
  
  /* flex: 1 제거하여 내용물이 없으면 높이를 차지하지 않도록 함 (다만 stretch를 위해 flex-grow 필요시 조정) */
  flex-grow: 1; 
`;

export const Row = styled.div`
  width: 100%;
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 8px;
  font-size: 1.2rem;

  .select-like {
    border: 1.4px solid #CACADE;
    border-radius: 6px;
    padding: 0 18px;
    background: #fff;
    width: 100%;
    height: 44px;
    text-align: left;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .select-like:hover { border-color: #94a3b8; }

  input {
    border: 1.4px solid #CACADE;
    border-radius: 6px;
    padding: 8px;
    background: #fff;
    width: 100%;
    height: 40px;
    text-align: right;
  }
`;

export const IconBtn = styled.button`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 1px solid #e0e4ea;
  background: #e0e4ea;
  color: var(--text-neutral-strong);
  border-radius: 9999px;
  height: 34px;
  width: 34px;
`;

export const SubBar = styled.div`
  margin-top: 8px;
  display: flex;
  justify-content: center;
  width: 100%;
  button { width: 100%; background-color: var(--background-gray-200); }
`;

export const AddSmall = styled.button`
  background: #dfe5ef;
  padding: 6px 10px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 1.2rem;
`;

export const FooterRow = styled.div`
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  button {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;

    svg {
      transform: scale(1.1);
    }
  }
`;

export const RunBtn = styled.button`
  background: #e95a5a;
  color: #fff;
  border-radius: 6px;
  padding: 10px 12px;
  font-weight: 600;
  font-size: 1.3rem;
`;

export const ExcelBtn = styled.button`
  background: #3a4658;
  color: #fff;
  border-radius: 6px;
  padding: 10px 12px;
  font-weight: 600;
  font-size: 1.3rem;
  svg {
    margin-top: 2px;
  }
`;

export const PredGrid = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 12px;
  min-width: 0;
  align-items: stretch; /* ✅ 내부 카드 높이 동기화 */
`;

export const PredCard = styled.div`
  width: 100%;
  background-color: var(--background-gray-100);
  border: 1px solid var(--line-border);
  border-radius: 8px;
  padding: 20px;
  flex-shrink: 0;
  
  /* ✅ [수정] 고정 높이 제거, 높이 100%로 설정하여 CaseBox와 키 맞춤 */
  min-height: 300px; 
  height: 100%;
  /* max-height 제거됨 */

  display: flex;
  flex-direction: column;
  overflow: hidden; 

  transition: width 0.3s ease-in-out;
  cursor: pointer;

  &.mutiple {
    width: calc(50% - 11px);
  }
`;

export const PredHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 1.4rem;

  span {
    font-weight: 600;
    font-size: var(--font-size-sm);
  }
  .checkbox {
    transform: scale(1.6);
    cursor: pointer;
  }
`;

// ✅ [수정] 예측 테이블 스크롤 Wrapper
export const PredTableWrap = styled.div`
  flex-grow: 1;         
  overflow-y: auto;     
  min-height: 0;        
  margin-top: 4px;
  
  /* ✅ 원재료 박스와 높이 균형을 맞추기 위한 최대 높이 설정 */
  max-height: 580px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 3px;
  }
`;

// ✅ [수정] Tooltip이 포함된 테이블 스타일링
export const PredTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background-color: #ffffff;
  thead th {
    position: sticky;
    top: 0;
    z-index: 10;
    
    color: white;
    font-size: 1.2rem;
    font-weight: 500;
    padding: 10px 8px;
    border-bottom: 2px solid #e2e8f0;
    text-align: center;
    white-space: nowrap;
    font-style: normal;
    vertical-align: middle;
    line-height: 1.2;
  }
  
  thead th:first-child {
    text-align: left;
    padding-left: 12px;
  }

  tbody td {
    padding: 8px 6px;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
  }
  
  /* ✅ Label Cell 스타일 수정: Tooltip 로직 추가 */
  td.label {
    padding: 0; /* 내부 div가 패딩을 담당 */
    vertical-align: middle;
  }

  /* 툴팁을 위한 내부 Wrapper */
  .cell-inner {
    padding: 8px 6px 8px 12px; /* 기존 td 패딩 복구 */
    position: relative;
    width: 100%;
    max-width: 200px;
    display: flex;
    align-items: center;
  }

  /* 말줄임표 처리된 텍스트 */
  .text-content {
    display: block;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
    color: #1e293b;
    font-size: 1.2rem;
  }

  /* 툴팁 박스 (Hover시 등장) */
  .tooltip-box {
    display: none;
    position: absolute;
    top: -30px; /* 텍스트 바로 위쪽 */
    left: 12px;
    z-index: 100;
    
    background-color: #1e293b;
    color: #fff;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 500;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    pointer-events: none; /* 툴팁 위에서 마우스 간섭 방지 */
  }

  /* 화살표 장식 (옵션) */
  .tooltip-box::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 10px;
    border-width: 5px;
    border-style: solid;
    border-color: #1e293b transparent transparent transparent;
  }

  /* Hover 효과 */
  .cell-inner:hover .tooltip-box {
    display: block;
  }

  td input {
    width: 100%;
    height: 36px;
    padding: 0 8px;
    border-radius: 6px;
    text-align: right;
    font-size: 14px;
    font-weight: 600;
    outline: none;
    border: 1px solid transparent;
    font-style: normal;
  }

  td:nth-child(2) input {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
    font-weight: 600;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    font-size: 1.2rem;
  }

  td:nth-child(3) input,
  td:nth-child(4) input {
    background: #f8fafc;
    color: #64748b;
    border: 1px solid #e2e8f0;
    font-size: 1.2rem;
  }
  thead {
    border-top-left-radius: 6px !important;
    border-top-right-radius: 6px !important;
    overflow: hidden;
    background-color: #81889E !important;
  }
`;

export const PredHint = styled.div`
  margin-top: 15px;
  font-size: var(--font-size-base);
  color: var(--text-neutral-medium);
`;

export const ChartWrap = styled.div`
  height: 420px;
`;

// ... Modal 관련 스타일들은 기존 그대로 유지 ...
export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  z-index: 10050;
  display: grid;
  place-items: center;
`;

export const ModalPanel = styled.div`
  width: min(860px, 92vw);
  max-height: 80vh;
  overflow: hidden;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0,0,0,.25);
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  font-size: 1.2rem;
`;

export const ModalHead = styled.div`
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eef2f7;
  background-color: #fff;

  h4 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
  }

  button {
    border: 0;
    background: #f1f5f9;
    border-radius: 8px;
    padding: 6px 10px;
    font-weight: 700;
    cursor: pointer;
  }
`;

export const ModalBody = styled.div`
  padding: 0 16px 18px 16px;
  overflow: auto;
`;

export const DetailTable = styled.table`
  min-width: 100%;
  overflow-x: scroll;
  border-collapse: separate;
  border-spacing: 0;
  
  th {
    position: sticky;
    top: 0;
    z-index: 10;
    background: #81889E;
    color: #FFFFFF;
    font-weight: 600;
    padding: 10px;
    border-bottom: 2px solid #e2e8f0;
    text-align: center;
    font-style: normal;
    vertical-align: middle;
    font-size: 1.2rem;
  }
  
  th:first-child { text-align: left; }
  
  td {
    border-bottom: 1px solid #f1f5f9;
    padding: 10px 12px;
    font-size: 14px;
    color: #334155;
    vertical-align: middle;
    font-style: normal;
    font-size: 1.2rem;
  }

  td:not(:first-child) {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  td:nth-child(2) {
    color: #1d4ed8;
    font-weight: 600;
    background-color: #eff6ff;
  }
`;

export const ErrorBar = styled.div`
  margin-top: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid #fecaca;
  background: #fff1f2;
  color: #7f1d1d;
  border-radius: 8px;
  strong { font-weight: 800; }
  span { flex: 1; }
  button {
    background: #fecaca; color:#7f1d1d; border:0; padding:6px 10px;
    border-radius:6px; cursor:pointer;
  }
`;