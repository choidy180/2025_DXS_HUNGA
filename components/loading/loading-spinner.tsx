// app/components/LoadingGate.tsx
"use client";

import React from "react";
import Image from "next/image";
import imageSpinner from "@/public/loading/spinner-load-icon.svg";

interface LoadingOpacity {
  /** 0(투명) ~ 1(불투명), 기본 1 */
  opacity?: number;
}

/** ---------------- Spinner (전면 오버레이) ---------------- */
export const LoadingSpinnerComponent: React.FC<LoadingOpacity> = ({ opacity = 1 }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="페이지 로딩 중"
      // ✅ 인라인 스타일로 최초 페인트부터 중앙 고정 (SSR/CSS 지연 영향 없음)
      style={{
        position: "fixed",
        inset: 0, // top:0,right:0,bottom:0,left:0
        width: "100vw",
        minHeight: "100svh", // 모바일 주소창 변동에도 안전
        display: "grid",
        placeItems: "center", // 그리드 중앙정렬
        // 배경 불투명도 적용
        background: `rgba(255, 255, 255, ${opacity})`,
        zIndex: 9999,
      }}
    >
      {/* <Image
        src={imageSpinner}
        width={100}
        height={100}
        alt="loading"
        priority // ✅ 즉시 로드
        // ✅ 이미지를 블록 요소로 만들어 초기 베이스라인/라인박스 점프 방지
        style={{ display: "block" }}
      /> */}
    </div>
  );
};

/** ---------------- LoadingGate ---------------- */
interface LoadingGateProps {
  isLoading: boolean;
  /** 스피너를 전면 오버레이로 덮을지 여부 (기본 true) */
  overlay?: boolean;
  /** 스피너 대신 커스텀 로더를 쓰고 싶을 때 */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const LoadingGate: React.FC<LoadingGateProps> = ({
  isLoading,
  overlay = true,
  fallback,
  children,
}) => {
  if (isLoading) {
    if (fallback) return <>{fallback}</>;
    // 기본: 전체 화면 오버레이 스피너
    return overlay ? <LoadingSpinnerComponent /> : <LoadingInline />;
  }
  return <>{children}</>;
};

export default LoadingGate;

/** 컨텐츠 영역 안에서만 쓰고 싶을 때의 간단한 인라인 스피너 (선택) */
function LoadingInline() {
  return (
    <div style={{ padding: 16, display: "flex", justifyContent: "center" }}>
      {/* 인라인일 때도 동일한 SVG 사용, 오버레이 스타일만 제거 */}
      <Image
        src={imageSpinner}
        width={48}
        height={48}
        alt="loading"
        priority
        style={{ display: "block" }}
      />
    </div>
  );
}
