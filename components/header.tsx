// Header.tsx
import React, { useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { HiOutlineHome } from 'react-icons/hi2';
import { RxCountdownTimer } from 'react-icons/rx';
import styled, { css } from 'styled-components';

/**
 * 💡 1. 타입 정의 (Interfaces)
 */

// 탭 데이터의 구조를 정의합니다. (사용하지 않지만 기존 구조 유지를 위해 남겨둠)
interface TabItem {
  id: string;
  label: string;
  marker: string;
}

// TabButton 컴포넌트가 받을 props를 정의합니다. (활성화 상태 포함)
interface TabButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // $접두사는 styled-components에서 transient props를 나타내며, DOM으로 전달되는 것을 방지합니다.
  $active: boolean; 
}

// Header 컴포넌트가 받을 props를 정의합니다.
interface HeaderProps {
  initialActiveTab?: string; 
  onTabChange?: (tabId: string) => void;
}

/**
 * 🎨 3. Styled Components 정의
 */

// A. 전체 헤더 컨테이너
const HeaderContainer = styled.header`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  padding: 8px 24px;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e5e5;
  box-sizing: border-box;
`;

// B. 좌측 로고/타이틀 영역
const LeftSection = styled.div`
  display: flex;
  align-items: center;
  width: 33.3333%;
`;

const LogoIcon = styled.div`
  width: 40px;
  height: 40px;
  margin-right: 8px;
  background: linear-gradient(135deg, #ff5a5f, #9b51e0);
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.4rem;
  color: #ffffff;
  letter-spacing: 1px;
  font-weight: 400;
`;

const Title = styled.span`
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: -1.4px;
  color: #222222;
  white-space: nowrap;
  margin-left: 10px;
`;

// C. 중앙 탭 네비게이션 영역
const CenterTabs = styled.nav`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  width: 33.3333%;
`;

// 활성화된 탭 스타일
const activeTabStyles = css`
  background-color: #ff5a5f;
  color: #ffffff;
  box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
`;

// 비활성화된 탭 스타일
const inactiveTabStyles = css`
  color: #888888;
  background: transparent;

  &:hover {
    background-color: #f5f5f5;
  }

  /* 아이콘 색상을 TabButton의 inactive 상태 글자색을 따르도록 설정 */
  /* & > svg {
    color: #888888;
  } */
`;

// TabButton에 TabButtonProps 타입을 적용합니다.
const TabButton = styled.button<TabButtonProps>`
  display: flex;
  align-items: center;
  padding: 8px 24px;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s ease-in-out;
  border-radius: 8px;
  gap: 4px;

  ${(props) => (props.$active ? activeTabStyles : inactiveTabStyles)}
`;


// 🚀 Styled Component: HiOutlineHome 아이콘을 감싸고 $active prop을 처리합니다.
const StyledHomeIcon = styled(HiOutlineHome)<{ $active: boolean }>`
  font-size: 1.2rem;
  /* 활성화 상태에 따라 아이콘 색상 설정 */
  color: ${(props) => (props.$active ? '#ffffff' : '#888888')};
`;

// 🚀 Styled Component: RxCountdownTimer 아이콘을 감싸고 $active prop을 처리합니다.
const StyledTimerIcon = styled(RxCountdownTimer)<{ $active: boolean }>`
  font-size: 1.2rem;
  /* 활성화 상태에 따라 아이콘 색상 설정 */
  color: ${(props) => (props.$active ? '#ffffff' : '#888888')};
`;

// 🚀 Styled Component: FiRefreshCw 아이콘을 감싸고 $active prop을 처리합니다.
const StyledRefreshIcon = styled(FiRefreshCw)<{ $active: boolean }>`
  font-size: 1.2rem;
  /* 활성화 상태에 따라 아이콘 색상 설정 */
  color: ${(props) => (props.$active ? '#ffffff' : '#888888')};
`;


// D. 우측 프로필 영역
const RightProfile = styled.div`
  display: flex;
  justify-content: end;
  align-items: center;
  width: 33.3333%;
`;

const ProfileAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #9b51e0;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const UserIcon = styled.span`
  font-size: 18px;
  color: #ffffff;
`;


/**
 * ⚛️ 4. React 컴포넌트 (TypeScript 적용)
 */
const Header: React.FC<HeaderProps> = ({ initialActiveTab = "메인", onTabChange }) => {
  // 탭 상태 관리: initialActiveTab prop을 초기값으로 사용
  const [currentActiveTab, setCurrentActiveTab] = useState(initialActiveTab);

  // 탭 클릭 핸들러
  const handleTabClick = (tabId: string) => {
    setCurrentActiveTab(tabId); // 상태 업데이트
    if (onTabChange) {
      onTabChange(tabId); // 외부로 상태 변경 알림
    }
  };

  return (
    <HeaderContainer>
      {/* 1. 좌측 영역 */}
      <LeftSection>
        <LogoIcon>
          AI
        </LogoIcon>
        <Title>
          가상 레시피 기반 컴파운드 물성 예측
        </Title>
      </LeftSection>

      {/* 2. 중앙 영역: 탭 네비게이션 */}
      <CenterTabs>
        <TabButton
          $active={currentActiveTab === "메인"}
          onClick={() => handleTabClick("메인")}
          type="button" 
        >
          {/* Styled 래퍼로 교체 */}
          <StyledHomeIcon $active={currentActiveTab === "메인"}/>
          메인
        </TabButton>
        <TabButton
          $active={currentActiveTab === "히스토리"}
          onClick={() => handleTabClick("히스토리")}
          type="button" 
        >
          {/* Styled 래퍼로 교체 */}
          <StyledTimerIcon $active={currentActiveTab === "히스토리"}/>
          히스토리
        </TabButton>
        <TabButton
          $active={currentActiveTab === "재학습"}
          onClick={() => handleTabClick("재학습")}
          type="button" 
        >
          {/* Styled 래퍼로 교체 */}
          <StyledRefreshIcon $active={currentActiveTab === "재학습"}/>
          재학습
        </TabButton>
      </CenterTabs>

      {/* 3. 우측 영역 */}
      <RightProfile>
        <ProfileAvatar>
          <UserIcon>👤</UserIcon>
        </ProfileAvatar>
      </RightProfile>
    </HeaderContainer>
  );
};

export default Header;