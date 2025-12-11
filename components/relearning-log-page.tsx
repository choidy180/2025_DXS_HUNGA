// RelearningLogPage.tsx
"use client";
import React, { useState, useMemo, useCallback, useRef } from 'react';
import styled, { css } from 'styled-components';
import { IoIosArrowUp, IoIosArrowDown, IoIosArrowBack, IoIosArrowForward, IoMdCloseCircleOutline } from 'react-icons/io'; // 삭제 아이콘 추가
import { FaUpload } from "react-icons/fa";
import { HiOutlineDocumentText } from "react-icons/hi";
import { LuRefreshCcw } from 'react-icons/lu';

/**
 * 💡 설정 및 상수
 */
const ROWS_PER_PAGE = 14;
const COLUMN_HEADERS = ['재학습 시간', '상태', '학습 파일', '데이터 수량', '사용 모델'];
const SORTABLE_COLUMNS = ['재학습 시간', '상태', '데이터 수량'];

// 한글 헤더 이름과 실제 LogItem 속성(Key) 매핑
const COLUMN_KEY_MAP = {
  '재학습 시간': 'time',
  '상태': 'status',
  '학습 파일': 'file',
  '데이터 수량': 'dataCount',
  '사용 모델': 'model',
} as const;

// 속성 키의 타입 정의 (LogItem의 실제 키)
type LogItemKey = keyof LogItem;


/**
 * 💡 타입 정의
 */
interface LogItem {
  id: number;
  time: string;
  status: '완료' | '실패' | '진행중';
  file: string;
  dataCount: number;
  model: string;
}

interface SortConfig {
  key: string | null; 
  direction: 'ascending' | 'descending';
}

/**
 * 💡 더미 데이터 생성
 */
const createDummyLogData = (): LogItem[] => {
  const data = [];
  const totalRows = 30; 

  for (let i = 0; i < totalRows; i++) {
    const minute = String(i % 60).padStart(2, '0');
    const statusOptions: LogItem['status'][] = ['완료', '실패', '진행중'];
    
    data.push({
      id: i,
      time: `2024-12-09 19:${minute}:59`,
      status: statusOptions[i % 3],
      file: 'data_file.csv',
      dataCount: (i % 5 + 1) * 200, 
      model: i % 2 === 0 ? 'V' : 'W',
    });
  }
  return data;
};

const DUMMY_LOG_DATA = createDummyLogData();

/**
 * 🎨 Styled Components 정의
 */

// 전체 페이지 컨테이너
const PageContainer = styled.div`
  width: 100%;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-sizing: border-box;
`;

const SectionTitle = styled.h2`
  font-size: 1.4rem;
  font-weight: 600;
  color: #222222;
  margin: 0;
`;

// --- 1. 데이터 업로드 섹션 스타일 ---

// 파일 업로드 영역
const UploadArea = styled.div<{ $isDragging: boolean }>`
  width: 100%;
  padding: 50px 20px;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  background-color: ${(props) => (props.$isDragging ? '#f5f5ff' : '#ffffff')};
  transition: background-color 0.2s;
`;

const UploadIcon = styled(FaUpload)`
  font-size: 2.5rem;
  color: #cccccc;
`;

const UploadText = styled.p`
  color: #555555;
  font-size: 1rem;
  text-align: center;
  margin: 0;
`;

const SupportedFilesText = styled.p`
  color: #999999;
  font-size: 0.9rem;
  margin: 0;
`;

// 파일 선택 버튼 스타일
const FileSelectButton = styled.button`
  padding: 10px 20px;
  background-color: #ffffff;
  color: #ff5a5f;
  border: 1px solid #ff5a5f;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color: #fff0f0;
  }
`;

// 재학습 버튼
const RelearnButton = styled.button`
  display: flex;
  align-items: center;
  padding: 10px 20px;
  background-color: #ff5a5f;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
  box-shadow: 0 4px 6px rgba(255, 90, 95, 0.3);

  &:hover {
    background-color: #e04f51;
  }
`;

const UploadFooter = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 20px;
`;

// 🚀 추가: 업로드된 파일 표시 컴포넌트
const UploadedFileDisplay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #e8f5e9; /* 연한 녹색 배경 */
  border: 1px solid #c8e6c9;
  border-radius: 4px;
  font-size: 0.95rem;
  color: #388e3c;
  font-weight: 500;
  margin-top: 20px;
  max-width: 80%;
  align-self: center; /* 중앙 정렬 */
`;

const FileName = styled.span`
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #388e3c;
  padding: 0;
  line-height: 1;
  transition: color 0.2s;

  &:hover {
    color: #1b5e20;
  }
`;

// --- 2. 재학습 로그 테이블 스타일 ---
// (이하 테이블 스타일은 변경 없음)
const TableContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%; 
  min-width: 700px; 
  border-collapse: collapse;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const Th = styled.th<{ $sortable?: boolean }>`
  background-color: #f7f7f7;
  color: #333333;
  font-weight: 600;
  text-align: left;
  padding: 12px 16px;
  white-space: nowrap;
  border-right: 1px solid #e0e0e0;
  border-bottom: 2px solid #e0e0e0;
  cursor: ${(props) => (props.$sortable ? 'pointer' : 'default')};
  user-select: none;

  &:last-child {
    border-right: none;
  }
`;

const Td = styled.td`
  padding: 10px 16px;
  text-align: left;
  white-space: nowrap;
  border-right: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  color: #555555;

  &:last-child {
    border-right: none;
  }
`;

const Tr = styled.tr`
  &:nth-child(even) {
    background-color: #fcfcfc;
  }
  &:hover {
    background-color: #f5f5f5;
  }

  &:last-child ${Td} {
    border-bottom: none;
  }
`;

const StatusTag = styled.span<{ status: LogItem['status'] }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  color: #ffffff;

  ${(props) => {
    switch (props.status) {
      case '완료':
        return css`
          background-color: #4CAF50;
        `;
      case '실패':
        return css`
          background-color: #F44336;
        `;
      case '진행중':
        return css`
          background-color: #2196F3;
        `;
    }
  }}
`;

const SortArrow = styled.span`
  margin-left: 6px;
  display: inline-flex;
  align-items: center;
  color: #888888;
  font-size: 0.8rem;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #e0e0e0;
  background-color: #ffffff;
  gap: 12px;
`;

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const PageButton = styled.button<{ $active?: boolean }>`
  width: 30px;
  height: 30px;
  border: 1px solid #dcdcdc;
  background-color: ${(props) => (props.$active ? '#ff5a5f' : '#ffffff')};
  color: ${(props) => (props.$active ? '#ffffff' : '#555555')};
  border-radius: 4px;
  cursor: pointer;
  font-weight: ${(props) => (props.$active ? '600' : '400')};
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background-color: ${(props) => (props.$active ? '#e04f51' : '#f0f0f0')};
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;


/**
 * ⚛️ React 컴포넌트 (RelearningLogPage)
 */
const RelearningLogPage: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // 💡 파일 상태
  
  const [logData] = useState<LogItem[]>(DUMMY_LOG_DATA);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '재학습 시간', direction: 'descending' });
  
  const inputRef = useRef<HTMLInputElement>(null);

  // --- 1. 파일 업로드 로직 ---
  
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  }, []);

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  // 🚀 추가: 파일 삭제 핸들러
  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (inputRef.current) {
        inputRef.current.value = ""; // 파일 인풋 값도 초기화 (선택 사항)
    }
  };

  const handleRelearn = () => {
    if (selectedFile) {
      console.log(`Relearning started with file: ${selectedFile.name}`);
      // 실제 재학습 로직 (API 호출 등)
      alert(`재학습을 시작합니다: ${selectedFile.name}`);
    } else {
      alert("파일을 선택해주세요.");
    }
  };


  // --- 2. 로그 테이블 로직 (정렬 및 페이지네이션) ---
  
  // 정렬 로직
  const sortedData = useMemo(() => {
    let sortableItems = [...logData];
    
    if (sortConfig.key !== null) {
      const sortKey = COLUMN_KEY_MAP[sortConfig.key as keyof typeof COLUMN_KEY_MAP] as LogItemKey;
      
      sortableItems.sort((a, b) => {
        const aValue = a[sortKey];
        const bValue = b[sortKey];
        
        let comparison = 0;
        
        if (sortKey === 'dataCount') {
          comparison = (aValue as number) - (bValue as number);
        } 
        else {
          const aStr = String(aValue);
          const bStr = String(bValue);
          if (aStr < bStr) comparison = -1;
          if (aStr > bStr) comparison = 1;
        }

        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return sortableItems;
  }, [logData, sortConfig]);

  // 정렬 핸들러
  const handleSort = (key: string) => {
    let direction: SortConfig['direction'] = 'ascending';
    
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  // 정렬 아이콘 렌더링 함수
  const renderSortArrow = (key: string) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return (
      <SortArrow>
        {sortConfig.direction === 'ascending' ? <IoIosArrowUp /> : <IoIosArrowDown />}
      </SortArrow>
    );
  };

  // 페이지네이션 로직
  const totalPages = Math.ceil(sortedData.length / ROWS_PER_PAGE);

  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    const endIndex = startIndex + ROWS_PER_PAGE;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage]);

  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);
  
  // 페이지네이션 버튼 렌더링
  const renderPaginationButtons = () => {
    const pageButtons = [];
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <PageButton
          key={i}
          $active={i === currentPage}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </PageButton>
      );
    }
    return pageButtons;
  };


  return (
    <PageContainer>
      
      {/* 1. 데이터 업로드 섹션 */}
      <SectionTitle>데이터 업로드</SectionTitle>
      
      {/* 🚀 수정: 파일 업로드 영역과 업로드된 파일 표시 분리 */}
      <UploadArea 
        $isDragging={dragActive}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <UploadIcon />
        <UploadText>
          파일을 드래그하여 놓거나 클릭하여 선택하세요
        </UploadText>
        <SupportedFilesText>
          엑셀 파일만 업로드 가능합니다 (.xlsx, .xls)
        </SupportedFilesText>
        
        <input 
          ref={inputRef} 
          type="file" 
          accept=".xlsx, .xls, .csv" 
          style={{ display: 'none' }} 
          onChange={handleChange} 
        />
        
        <FileSelectButton onClick={onButtonClick}>
          파일 선택
        </FileSelectButton>
      </UploadArea>
      
      {/* 🚀 추가: 업로드된 파일 정보 표시 (가시성 확보) */}
      {selectedFile && (
        <UploadedFileDisplay>
          <FileName title={selectedFile.name}>{selectedFile.name}</FileName>
          <RemoveButton onClick={handleRemoveFile}>
            <IoMdCloseCircleOutline size={18} />
          </RemoveButton>
        </UploadedFileDisplay>
      )}

      <UploadFooter>
        <RelearnButton onClick={handleRelearn}>
          <LuRefreshCcw size={18} style={{ marginRight: '8px' }}/>
          재학습
        </RelearnButton>
      </UploadFooter>


      {/* 2. 재학습 로그 섹션 */}
      <SectionTitle>재학습 로그</SectionTitle>
      
      <TableContainer>
        <TableWrapper>
          <Table>
            <thead>
              <Tr>
                {COLUMN_HEADERS.map((header) => (
                  <Th 
                    key={header}
                    $sortable={SORTABLE_COLUMNS.includes(header)}
                    onClick={SORTABLE_COLUMNS.includes(header) ? () => handleSort(header) : undefined}
                  >
                    {header}
                    {renderSortArrow(header)}
                  </Th>
                ))}
              </Tr>
            </thead>
            <tbody>
              {currentData.map((log) => (
                <Tr key={log.id}>
                  <Td>{log.time}</Td>
                  <Td>
                    <StatusTag status={log.status}>{log.status}</StatusTag>
                  </Td>
                  <Td>{log.file}</Td>
                  <Td>{log.dataCount.toLocaleString()}</Td>
                  <Td>{log.model}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>

        {/* 푸터 (페이지네이션) */}
        <Footer>
          <span style={{ fontSize: '0.9rem', color: '#888' }}>
            {currentPage} / {totalPages}
          </span>
          
          <PaginationControls>
            <PageButton 
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              &lt;&lt;
            </PageButton>
            <PageButton 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <IoIosArrowBack />
            </PageButton>
            
            {renderPaginationButtons()}
            
            <PageButton 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <IoIosArrowForward />
            </PageButton>
            <PageButton 
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              &gt;&gt;
            </PageButton>
          </PaginationControls>
        </Footer>
      </TableContainer>
    </PageContainer>
  );
};

export default RelearningLogPage;