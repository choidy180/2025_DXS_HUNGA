import React, { useEffect, useMemo, useRef, useState } from "react";
import styled, { css } from "styled-components";
import { Option } from "../types/types"; // types.ts에서 정의한 Option 타입 import

interface SelectPopupProps {
  open: boolean;
  options: Option[];
  value?: string;
  onClose: () => void;
  onSelect: (opt: Option) => void;
  width?: number;
  maxHeight?: number;
}

export default function SelectPopup({
  open,
  options,
  value,
  onClose,
  onSelect,
  width = 500,
  maxHeight = 400,
}: SelectPopupProps) {
  const popRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  // 검색 필터링 로직
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(term) || o.value.toLowerCase().includes(term)
    );
  }, [q, options]);

  // 스크롤 잠금 처리
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // 열릴 때 초기화 및 포커싱
  useEffect(() => {
    if (open) {
      setQ("");
      const idx = filtered.findIndex((o) => o.value === value || o.label === value);
      setActive(idx >= 0 ? idx : 0);
      
      // 약간의 지연 후 포커스 (애니메이션 등 고려)
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [open]); // value, filtered 의존성 제외 (열릴 때만 초기화)

  // 키보드 네비게이션
  useEffect(() => {
    if (!open) return;
    const onDocKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((p) => Math.min(p + 1, filtered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((p) => Math.max(p - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        // 현재 활성화된 아이템 선택
        const opt = filtered[active];
        if (opt) {
          onSelect(opt);
          onClose(); // 선택 후 닫기
        }
      }
    };
    document.addEventListener("keydown", onDocKey);
    return () => document.removeEventListener("keydown", onDocKey);
  }, [open, filtered, active, onClose, onSelect]);

  const handleConfirm = () => {
    const opt = filtered[active];
    if (opt) onSelect(opt);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <Overlay onMouseDown={onClose} aria-hidden="true" />
      <PopupContainer
        ref={popRef}
        role="dialog"
        aria-modal="true"
        $width={width}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* [Header] */}
        <Header>
          <h3>원재료 입력</h3>
          <CloseButton onClick={onClose} aria-label="닫기">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </CloseButton>
        </Header>

        {/* [Search] */}
        <SearchSection>
          <div className="input-wrapper">
            <span className="icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              ref={inputRef}
              placeholder="검색 (코드/이름)"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0); // 검색 시 첫 번째 항목 활성화
              }}
            />
          </div>
        </SearchSection>

        {/* [List] */}
        <ListSection $maxHeight={maxHeight} role="listbox">
          {filtered.length === 0 ? (
            <EmptyState>검색 결과가 없습니다.</EmptyState>
          ) : (
            filtered.map((o, i) => {
              const isSelected = value === o.value || value === o.label;
              const isActive = i === active;

              return (
                <OptionItem
                  key={o.value}
                  role="option"
                  aria-selected={isSelected}
                  $isSelected={isSelected}
                  $isActive={isActive}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(o);
                    onClose();
                  }}
                >
                  <CheckBox $isSelected={isSelected}>
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </CheckBox>
                  <div className="text-info">
                    <span className="code">{o.value}</span>
                    <span className="name">{o.label}</span>
                  </div>
                </OptionItem>
              );
            })
          )}
        </ListSection>

        {/* [Footer] */}
        <Footer>
          <Button $variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button $variant="primary" onClick={handleConfirm}>
            확인
          </Button>
        </Footer>
      </PopupContainer>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                   */
/* -------------------------------------------------------------------------- */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 10000;
  backdrop-filter: blur(2px);
`;

const PopupContainer = styled.div<{ $width: number }>`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: ${(props) => props.$width}px;
  max-width: 90vw;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  z-index: 10001;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Pretendard', sans-serif;
`;

const Header = styled.div`
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;

  h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #111827;
  }
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  border-radius: 4px;
  transition: background 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #1f2937;
  }
`;

const SearchSection = styled.div`
  padding: 16px 20px 10px 20px;

  .input-wrapper {
    position: relative;
    width: 100%;
    
    .icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #9ca3af;
      display: flex;
    }

    input {
      width: 100%;
      height: 44px;
      padding: 0 10px 0 36px;
      border-radius: 6px;
      border: 1px solid #d1d5db;
      text-align: left;
      outline: none;
      font-size: 16px;
      color: #374151;
      box-sizing: border-box;
      transition: border-color 0.2s, box-shadow 0.2s;

      &:focus {
        border-color: #ef4444; /* Red focus */
        box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
      }
    }
  }
`;

const ListSection = styled.div<{ $maxHeight: number }>`
  flex: 1;
  max-height: ${(props) => props.$maxHeight}px;
  overflow-y: auto;
  padding: 0 20px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #d1d5db;
    border-radius: 3px;
  }
`;

const EmptyState = styled.div`
  padding: 40px 0;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
`;

const OptionItem = styled.div<{ $isSelected: boolean; $isActive: boolean }>`
  padding: 12px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #f3f4f6;
  background: ${(props) => (props.$isActive ? "#f8fafc" : "transparent")};
  
  /* 선택되었을 때 배경 틴트 */
  ${(props) => props.$isSelected && css`
    background: #fef2f2 !important; /* light red bg */
  `}

  .text-info {
    display: flex;
    gap: 12px;
    align-items: center;
    
    .code {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      min-width: 80px;
    }
    .name {
      font-size: 14px;
      color: #4b5563;
    }
  }
`;

const CheckBox = styled.div<{ $isSelected: boolean }>`
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;

  ${(props) => props.$isSelected && css`
    border-color: #ef4444;
    background: #ef4444;
  `}
`;

const Footer = styled.div`
  padding: 16px 20px;
  display: flex;
  gap: 10px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
`;

const Button = styled.button<{ $variant: "primary" | "secondary" }>`
  flex: 1;
  height: 44px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  ${(props) =>
    props.$variant === "primary"
      ? css`
          background: #ef4444;
          color: white;
          border: none;
          &:hover {
            background: #dc2626;
          }
        `
      : css`
          background: #fff;
          color: #374151;
          border: 1px solid #d1d5db;
          &:hover {
            background: #f9fafb;
          }
        `}
`;