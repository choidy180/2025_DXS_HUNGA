"use client";
import Header from "@/components/header";
import DXHungaPage from "@/components/hunga";
import RelearningLogPage from "@/components/relearning-log-page";
import ResultPage from "@/components/resultPage";
import { useState } from "react";
import styled from "styled-components";


export default function Home() {
  // 2. Home 컴포넌트에서 activeTab 상태를 관리
  const [activeTab, setActiveTab] = useState("메인");

  // 3. Header로부터 상태 변경을 받을 핸들러 함수
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };
  return (
    <Container>
      <Wrapper>
        <Header 
          initialActiveTab={activeTab} 
          onTabChange={handleTabChange} 
        />
        {activeTab === "메인" && <DXHungaPage />}
        {activeTab === "히스토리" && <ResultPage/>}
        {activeTab === "재학습" && <RelearningLogPage/>}
      </Wrapper>
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  min-height: 100vh;
  background-color: #F4F5F7;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
`

const Wrapper = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: start;
`;
