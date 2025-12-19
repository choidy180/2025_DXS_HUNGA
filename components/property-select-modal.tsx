import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Option } from "../types/types";

interface Props {
  open: boolean;
  options: Option[]; // 전체 ITEM_T 목록
  selectedCodes: string[]; // 현재 선택된 ITEM_T 코드들
  onClose: () => void;
  onConfirm: (selectedCodes: string[]) => void;
}

export default function PropertySelectModal({
  open,
  options,
  selectedCodes,
  onClose,
  onConfirm,
}: Props) {
  const [q, setQ] = useState("");
  // 로컬 선택 상태 관리
  const [checkedSet, setCheckedSet] = useState<Set<string>>(new Set(selectedCodes));

  // 모달 열릴 때 초기값 동기화
  useEffect(() => {
    if (open) {
      setQ("");
      setCheckedSet(new Set(selectedCodes));
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [open, selectedCodes]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(term) || o.value.toLowerCase().includes(term)
    );
  }, [q, options]);

  const toggleCheck = (code: string) => {
    const next = new Set(checkedSet);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setCheckedSet(next);
  };

  const toggleAll = () => {
    // 필터링된 목록 기준으로 전체 선택/해제
    const allFilteredCodes = filtered.map(o => o.value);
    const isAllChecked = allFilteredCodes.every(c => checkedSet.has(c));

    const next = new Set(checkedSet);
    if (isAllChecked) {
      allFilteredCodes.forEach(c => next.delete(c));
    } else {
      allFilteredCodes.forEach(c => next.add(c));
    }
    setCheckedSet(next);
  };

  const handleConfirm = () => {
    // 원래 순서(options)를 유지하면서 선택된 것만 추출
    const result = options
      .filter(o => checkedSet.has(o.value))
      .map(o => o.value);
    
    onConfirm(result);
    onClose();
  };

  if (!open) return null;

  return (
    <Overlay onMouseDown={onClose}>
      <Panel onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <Header>
          <h3>물성 선택</h3>
          <CloseBtn onClick={onClose}>✕</CloseBtn>
        </Header>

        {/* Search */}
        <SearchWrap>
          <div className="input-box">
            <span className="icon">🔍</span>
            <input 
              placeholder="검색 (코드/이름)" 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
            />
          </div>
        </SearchWrap>

        {/* List */}
        <ListArea>
          {/* 전체 선택 */}
          <ItemRow onClick={toggleAll} style={{ borderBottom: "1px solid #f1f5f9" }}>
            <CheckBox $checked={filtered.length > 0 && filtered.every(o => checkedSet.has(o.value))}>
              {filtered.length > 0 && filtered.every(o => checkedSet.has(o.value)) && "✓"}
            </CheckBox>
            <span style={{ fontWeight: 600 }}>전체 데이터 선택</span>
          </ItemRow>

          {filtered.length === 0 && <NoData>검색 결과가 없습니다.</NoData>}

          {filtered.map((o) => {
            const isChecked = checkedSet.has(o.value);
            return (
              <ItemRow 
                key={o.value} 
                onClick={() => toggleCheck(o.value)}
                $checked={isChecked}
              >
                <CheckBox $checked={isChecked}>
                  {isChecked && "✓"}
                </CheckBox>
                <div className="info">
                  {/* ✅ [수정] 왼쪽은 Code(value), 오른쪽은 Name(label) */}
                  <span className="code">{o.value}</span>
                  <span className="name">{o.label}</span>
                </div>
              </ItemRow>
            );
          })}
        </ListArea>

        {/* Footer */}
        <Footer>
          <button className="cancel" onClick={onClose}>취소</button>
          <button className="confirm" onClick={handleConfirm}>확인</button>
        </Footer>
      </Panel>
    </Overlay>
  );
}

// --- Styles ---
const Overlay = styled.div`
  position: fixed; inset: 0; z-index: 10100;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
`;
const Panel = styled.div`
  background: #fff; width: 500px; max-width: 90vw;
  border-radius: 12px; overflow: hidden;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  display: flex; flex-direction: column;
  max-height: 80vh;
`;
const Header = styled.div`
  padding: 16px 20px; border-bottom: 1px solid #e5e7eb;
  display: flex; justify-content: space-between; align-items: center;
  h3 { margin: 0; font-size: 18px; font-weight: 700; }
`;
const CloseBtn = styled.button`
  background: none; border: none; font-size: 18px; cursor: pointer; color: #666;
`;
const SearchWrap = styled.div`
  padding: 16px 20px 10px;
  .input-box {
    position: relative; 
    input {
      width: 100%; height: 44px; padding: 0 10px 0 36px;
      border: 1px solid #d1d5db; border-radius: 6px; outline: none;
      &:focus { border-color: #ef4444; }
    }
    .icon { position: absolute; left: 10px; top: 12px; color: #9ca3af; }
  }
`;
const ListArea = styled.div`
  flex: 1; overflow-y: auto; padding: 0 20px;
`;
const ItemRow = styled.div<{ $checked?: boolean }>`
  display: flex; align-items: center; gap: 12px;
  padding: 12px 0; border-bottom: 1px solid #f8fafc;
  cursor: pointer;
  background-color: ${props => props.$checked ? "#fff1f2" : "transparent"}; /* 체크 시 붉은 배경 */
  
  .info {
    display: flex; align-items: center; gap: 10px;
    .code { font-weight: 700; color: #374151; width: 100px; }
    .name { color: #6b7280; }
  }
  &:hover { background-color: #f9fafb; }
`;
const CheckBox = styled.div<{ $checked?: boolean }>`
  width: 20px; height: 20px; border-radius: 4px;
  border: 1px solid ${props => props.$checked ? "#ef4444" : "#d1d5db"};
  background: ${props => props.$checked ? "#ef4444" : "#fff"};
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: bold;
`;
const NoData = styled.div`
  padding: 40px; text-align: center; color: #999;
`;
const Footer = styled.div`
  padding: 16px 20px; border-top: 1px solid #e5e7eb;
  display: flex; gap: 10px;
  button {
    flex: 1; height: 44px; border-radius: 6px; font-weight: 600; cursor: pointer; border: none;
  }
  .cancel { background: #fff; border: 1px solid #d1d5db; color: #374151; }
  .confirm { background: #ef4444; color: #fff; }
`;