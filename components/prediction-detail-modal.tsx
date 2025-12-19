import React, { useEffect } from "react";
import styled from "styled-components";
import { PredDetailRow } from "../types/types"; // types.ts에서 타입 import

interface Props {
  open: boolean;
  title: string;
  rows: PredDetailRow[];
  onClose: () => void;
}

// 숫자 포맷팅 헬퍼 (소수점 3자리)
const fmt3 = (v: unknown) => {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n.toFixed(3) : "0.000";
};

export default function PredictionDetailModal({ open, title, rows, onClose }: Props) {
  
  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // 스크롤 잠금
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <ModalOverlay onMouseDown={onClose} role="dialog" aria-modal="true">
      <ModalPanel onMouseDown={(e) => e.stopPropagation()}>
        <ModalHead>
          <h4>{title} 상세</h4>
          <CloseButton onClick={onClose} aria-label="닫기">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </CloseButton>
        </ModalHead>
        
        <ModalBody>
          <DetailTable>
            <thead>
              <tr>
                <th>CODENAME</th>
                <th>예측물성</th>
                <th>하한값</th>
                <th>상한값</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={`${r.codeName}-${i}`}>
                    <td className="label">{r.codeName}</td>
                    <td><input readOnly value={fmt3(r.y_pred)} /></td>
                    <td><input readOnly value={fmt3(r.ci_low)} /></td>
                    <td><input readOnly value={fmt3(r.ci_high)} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </DetailTable>
        </ModalBody>
      </ModalPanel>
    </ModalOverlay>
  );
}

/* -------------------------------------------------------------------------- */
/* Styled Components                                                          */
/* -------------------------------------------------------------------------- */

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  z-index: 10050;
  display: grid;
  place-items: center;
`;

const ModalPanel = styled.div`
  width: min(860px, 92vw);
  max-height: 85vh;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 내부 스크롤을 위해 */
  font-family: 'Pretendard', sans-serif;
`;

const ModalHead = styled.div`
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
  background-color: #fff;
  flex-shrink: 0;

  h4 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #111827;
  }
`;

const CloseButton = styled.button`
  border: 0;
  background: transparent;
  border-radius: 6px;
  padding: 6px;
  cursor: pointer;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #1f2937;
  }
`;

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 20px 20px;
  
  /* 스크롤바 스타일 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #d1d5db;
    border-radius: 3px;
  }
`;

const DetailTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  
  thead th {
    position: sticky;
    top: 0;
    z-index: 10;
    background: #6b7280; /* 다크 그레이 헤더 */
    color: #ffffff;
    font-weight: 600;
    padding: 12px;
    font-size: 14px;
    text-align: center;
    border-bottom: 1px solid #e5e7eb;
  }
  
  thead th:first-child {
    text-align: left;
    border-bottom-left-radius: 6px;
  }
  thead th:last-child {
    border-bottom-right-radius: 6px;
  }
  
  /* 상단 여백을 위해 thead 위쪽 row 추가 효과 */
  tbody::before {
    content: '';
    display: block;
    height: 12px;
  }

  tbody td {
    padding: 6px 8px;
    border-bottom: 1px solid #f3f4f6;
    vertical-align: middle;
  }

  /* 라벨 컬럼 */
  td.label {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    text-align: left;
    padding-left: 12px;
  }

  /* 인풋 공통 스타일 (Read-only Display 용도) */
  td input {
    width: 100%;
    height: 36px;
    padding: 0 10px;
    border-radius: 6px;
    text-align: right;
    font-size: 14px;
    font-weight: 500;
    outline: none;
    box-sizing: border-box;
    font-family: 'Pretendard', sans-serif;
  }

  /* 예측물성 (Blue Theme) */
  td:nth-child(2) input {
    background: #fff;
    color: #2563eb; /* 파란색 텍스트 */
    border: 1px solid #d1d5db;
    font-weight: 700;
  }

  /* 하한/상한값 (Gray Theme) */
  td:nth-child(3) input,
  td:nth-child(4) input {
    background: #f8fafc;
    color: #64748b;
    border: 1px solid #e2e8f0;
  }
`;