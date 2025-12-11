// ResultPage.tsx
"use client";
import React, { useState, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { FaSearch } from 'react-icons/fa';
import { IoIosArrowBack, IoIosArrowForward, IoIosArrowUp, IoIosArrowDown } from 'react-icons/io'; 
import { HiOutlineDocumentText } from "react-icons/hi";
import { DUMMY_DATA, COLUMN_HEADERS } from '@/data/dummy-data'; 

/**
 * 💡 TypeScript 오류 해결: Navigator 타입 확장
 * msSaveOrOpenBlob 속성은 IE/Edge에서만 존재하는 비표준 속성이므로,
 * TypeScript 환경에서 오류를 피하기 위해 Navigator 인터페이스를 확장합니다.
 */
declare global {
  interface Navigator {
    msSaveOrOpenBlob: (blob: Blob, fileName: string) => boolean;
  }
}

/**
 * 💡 설정 및 상수
 */
const ROWS_PER_PAGE = 20;
// 정렬 가능한 컬럼 목록
const SORTABLE_COLUMNS = ['날짜', '시험명', '시험작업자'];

/**
 * 💡 타입 정의
 */
interface SortConfig {
  key: string | null;
  direction: 'ascending' | 'descending';
}

/**
 * 💡 유틸리티 함수: 데이터를 CSV 문자열로 변환
 */
const convertToCSV = (headers: string[], data: any[]): string => {
  // 1. 헤더 (컬럼 이름)
  // UTF-8 환경에서 한글 깨짐 방지를 위해 BOM(Byte Order Mark)은 handleExport에서 Blob 생성 시 추가합니다.
  const headerRow = headers.map(h => `"${h}"`).join(',');
  
  // 2. 데이터 Row
  const dataRows = data.map(row => 
    headers.map(key => {
      // 쉼표나 따옴표가 포함된 값은 이스케이프 처리
      let value = row[key] !== undefined ? String(row[key]) : '';
      value = value.replace(/"/g, '""'); // 따옴표 이스케이프
      return `"${value}"`;
    }).join(',')
  );
  
  return [headerRow, ...dataRows].join('\n');
};


/**
 * 🎨 Styled Components 정의
 */

// ... (ResultPageContainer, HeaderSection, Title, FilterSection, DateInput, QueryButton, DateDivider 정의는 동일)
const ResultPageContainer = styled.div`
  width: 100%;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-sizing: border-box;
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 1.6rem;
  font-weight: 600;
  color: #222222;
  margin: 0;
  white-space: nowrap;
`;

const FilterSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #ffffff;
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
`;

const DateInput = styled.input`
  padding: 8px 10px;
  border: 1px solid #cccccc;
  border-radius: 4px;
  font-size: 1rem;
  color: #555555;
`;

const QueryButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  background-color: #ff5a5f;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e04f51;
  }
`;

const DateDivider = styled.span`
  color: #888888;
  font-size: 1rem;
  font-weight: 600;
`;


// --- 테이블 관련 스타일 ---

const TableContainer = styled.div`
  width: 100%;
  flex: 1; 
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const TableViewport = styled.div`
  flex: 1;
  overflow-x: auto; 
  overflow-y: hidden;
  position: relative;
`;

const Table = styled.table`
  width: max-content; 
  min-width: 100%; 
  border-collapse: collapse;
  font-size: 0.9rem;
  line-height: 1.4;
`;

// 정렬 아이콘 스타일
const SortArrow = styled.span`
  margin-left: 6px;
  display: inline-flex;
  align-items: center;
  color: #888888;
  font-size: 0.8rem;
`;

// 테이블 헤더 셀
const Th = styled.th<{ $sortable?: boolean }>`
  background-color: #f7f7f7;
  color: #333333;
  font-weight: 600;
  text-align: left;
  padding: 10px 16px;
  white-space: nowrap;
  border-right: 1px solid #e0e0e0;
  border-bottom: 2px solid #e0e0e0;
  
  // 정렬 가능 컬럼에만 포인터 스타일 적용
  cursor: ${(props) => (props.$sortable ? 'pointer' : 'default')}; 
  user-select: none;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${(props) => (props.$sortable ? '#f0f0f0' : '#f7f7f7')};
  }

  &:last-child {
    border-right: none;
  }
`;

// 테이블 데이터 셀
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

// 테이블 Row 스타일
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

// ... (Footer, PaginationControls, PageButton, ExcelButton, ExcelIcon 정의는 동일)
const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #e0e0e0;
  background-color: #ffffff;
`;

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PageButton = styled.button<{ $active?: boolean }>`
  width: 32px;
  height: 32px;
  border: 1px solid #dcdcdc;
  background-color: ${(props) => (props.$active ? '#ff5a5f' : '#ffffff')};
  color: ${(props) => (props.$active ? '#ffffff' : '#555555')};
  border-radius: 4px;
  cursor: pointer;
  font-weight: ${(props) => (props.$active ? '600' : '400')};
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background-color: ${(props) => (props.$active ? '#e04f51' : '#f0f0f0')};
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const ExcelButton = styled.button`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background-color: #424E5A; 
  color: #ffffff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color: #383838;
  }
`;

const ExcelIcon = styled(HiOutlineDocumentText)`
  margin-right: 6px;
  font-size: 1.1rem;
`;


/**
 * ⚛️ React 컴포넌트 (ResultPage)
 */
const ResultPage: React.FC = () => {
  const [startDate, setStartDate] = useState('2025-08-20');
  const [endDate, setEndDate] = useState('2025-08-20');
  const [searchExecuted, setSearchExecuted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' });

  // 날짜 필터링 로직
  const filteredData = useMemo(() => {
    if (!searchExecuted) return DUMMY_DATA;
    
    const start = startDate;
    const end = endDate;

    return DUMMY_DATA.filter(row => {
      const rowDate = row['날짜'];
      if (!rowDate) return false;

      return rowDate >= start && rowDate <= end;
    });
  }, [startDate, endDate, searchExecuted]);
  
  // 정렬된 데이터 계산 (필터링된 데이터를 기반으로 정렬)
  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        // 문자열 기반 정렬
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  // 날짜 검색 핸들러
  const handleSearch = () => {
    setSearchExecuted(true); 
    setCurrentPage(1);
    console.log(`Searching from ${startDate} to ${endDate}`);
  };

  // 정렬 핸들러
  const handleSort = (key: string) => {
    let direction: SortConfig['direction'] = 'ascending';
    
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
    setCurrentPage(1); 
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
  
  /**
   * 💡 Excel 출력 핸들러
   */
  const handleExport = () => {
    if (sortedData.length === 0) {
      alert("출력할 데이터가 없습니다.");
      return;
    }
    
    const csvData = convertToCSV(COLUMN_HEADERS, sortedData);
    // UTF-8 BOM (Byte Order Mark) 추가: 엑셀에서 한글 깨짐 방지
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvData], { type: 'text/csv;charset=utf-8;' }); 
    const fileName = `일자별_상세_리스트_${new Date().toISOString().slice(0, 10)}.csv`;

    // Modern browser (Chrome, Firefox, Safari, Edge)
    if (typeof window !== 'undefined' && window.navigator.msSaveOrOpenBlob) {
      // IE 10+ and Edge
      window.navigator.msSaveOrOpenBlob(blob, fileName);
    } else if (typeof window !== 'undefined') {
      // General browser
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
        console.error("Window object is not defined. Cannot initiate download.");
    }

    console.log("테이블 데이터를 Excel (CSV)로 출력했습니다. (총 Row 수:", sortedData.length, ")");
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


  return (
    <ResultPageContainer>
      <HeaderSection>
        <Title>일자별 상세 리스트</Title>
      </HeaderSection>
      
      <FilterSection>
        <DateInput 
          type="date" 
          value={startDate} 
          onChange={(e) => setStartDate(e.target.value)}
        />
        <DateDivider>~</DateDivider>
        <DateInput 
          type="date" 
          value={endDate} 
          onChange={(e) => setEndDate(e.target.value)}
        />
        <QueryButton onClick={handleSearch}>
          <FaSearch size={16} />
        </QueryButton>
      </FilterSection>

      {/* 데이터 테이블 영역 */}
      <TableContainer>
        <TableViewport>
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
                    {renderSortArrow(header)} {/* 정렬 아이콘 렌더링 */}
                  </Th>
                ))}
              </Tr>
            </thead>
            <tbody>
              {/* currentData는 이미 필터링/정렬된 데이터의 현재 페이지 */}
              {currentData.map((row, rowIndex) => (
                <Tr key={rowIndex}>
                  {COLUMN_HEADERS.map((key) => (
                    <Td key={key}>
                      {row[key] !== undefined ? row[key] : '-'} 
                    </Td>
                  ))}
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableViewport>

        {/* 푸터 (페이지네이션 및 Excel 출력) */}
        <Footer>
          <PaginationControls>
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
          </PaginationControls>

          <ExcelButton onClick={handleExport}>
            <ExcelIcon />
            Excel 출력
          </ExcelButton>
        </Footer>
      </TableContainer>
    </ResultPageContainer>
  );
};

export default ResultPage;