// ResultPage.tsx
"use client";
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { FaSearch } from 'react-icons/fa';
import { IoIosArrowBack, IoIosArrowForward, IoIosArrowUp, IoIosArrowDown } from 'react-icons/io'; 
import { HiOutlineDocumentText } from "react-icons/hi";

// ⚠️ [설정] API의 날짜/시간 컬럼명 (정확히 일치하는 경우 최우선 적용)
const DATE_KEY_NAME = 'TIMESTAMP'; 

/**
 * 💡 TypeScript 오류 해결: Navigator 타입 확장
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

/**
 * 💡 타입 정의
 */
interface SortConfig {
  key: string | null;
  direction: 'ascending' | 'descending';
}

interface ApiRowData {
  [key: string]: any;
}

/**
 * 💡 유틸리티 함수: 로컬 시간 기준 오늘 날짜 문자열(YYYY-MM-DD) 반환
 */
const getLocalTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 💡 유틸리티 함수: 다양한 형태의 날짜 문자열을 안전하게 Date 객체로 파싱
 * - "Oct 27 2025 2:33AM" 처럼 띄어쓰기가 없는 경우도 처리
 */
const parseSafeDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;

  let str = String(dateValue).trim();
  let date = new Date(str);

  // 1. 파싱 실패 시, AM/PM 앞 공백 누락 보정 시도 (예: "2:33AM" -> "2:33 AM")
  if (isNaN(date.getTime())) {
    const fixedStr = str.replace(/(\d)(AM|PM)/i, '$1 $2');
    date = new Date(fixedStr);
  }

  // 2. 여전히 유효하지 않으면 null 반환
  if (isNaN(date.getTime())) {
    return null;
  }
  
  return date;
};

/**
 * 💡 유틸리티 함수: 화면 표시용 포맷팅 (YYYY-MM-DD HH:MM AM/PM)
 */
const formatDateTime = (dateValue: any): string => {
  const date = parseSafeDate(dateValue);
  if (!date) return dateValue ? String(dateValue) : '-'; // 파싱 실패 시 원본 문자열 반환

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, '0');

  return `${year}-${month}-${day} ${strHours}:${minutes} ${ampm}`;
};

/**
 * 💡 유틸리티 함수: 데이터를 CSV 문자열로 변환
 */
const convertToCSV = (headers: string[], data: any[]): string => {
  const headerRow = headers.map(h => `"${h}"`).join(',');
  
  const dataRows = data.map(row => 
    headers.map(key => {
      let value = row[key];
      value = value !== undefined && value !== null ? String(value) : '';
      value = value.replace(/"/g, '""'); 
      return `"${value}"`;
    }).join(',')
  );
  
  return [headerRow, ...dataRows].join('\n');
};


/**
 * 🎨 Styled Components 정의
 */
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
  min-height: 400px;
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

const SortArrow = styled.span`
  margin-left: 6px;
  display: inline-flex;
  align-items: center;
  color: #888888;
  font-size: 0.8rem;
`;

const Th = styled.th<{ $sortable?: boolean }>`
  background-color: #f7f7f7;
  color: #333333;
  font-weight: 600;
  text-align: left;
  padding: 10px 16px;
  white-space: nowrap;
  border-right: 1px solid #e0e0e0;
  border-bottom: 2px solid #e0e0e0;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f0f0f0;
  }

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

  display: flex;
  justify-content: center;
  align-items: center;

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

const InfoMessage = styled.div`
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: #666;
`;

/**
 * ⚛️ React 컴포넌트 (ResultPage)
 */
const ResultPage: React.FC = () => {
  // 1. 초기값 설정: 시작일 2001-01-01, 종료일 오늘
  const [startDate, setStartDate] = useState('2001-01-01');
  const [endDate, setEndDate] = useState(getLocalTodayString());
  
  const [searchExecuted, setSearchExecuted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' });

  const [apiData, setApiData] = useState<ApiRowData[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 💡 API 데이터 호출 함수
   */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('http://1.254.24.170:24828/api/DX_API002007');
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const jsonData = await response.json();
        const targetData = Array.isArray(jsonData) ? jsonData : (jsonData.data || []);
        
        setApiData(targetData);

        if (targetData.length > 0) {
          const dynamicHeaders = Object.keys(targetData[0]);
          setColumns(dynamicHeaders);
        } else {
          setApiData([]);
        }

      } catch (err: any) {
        console.error("Failed to fetch data:", err);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 날짜 필터링 로직 (정상 작동하도록 수정됨)
  const filteredData = useMemo(() => {
    if (apiData.length === 0) return [];
    if (!searchExecuted) return apiData; 
    
    // YYYY-MM-DD 형태의 문자열
    const startStr = startDate;
    const endStr = endDate;

    return apiData.filter(row => {
      // 1. row에서 날짜 값 찾기
      const rawDateValue = row[DATE_KEY_NAME] || row['date'] || row['reg_dt'] || row['날짜'];
      
      // 2. 안전하게 Date 객체로 파싱 (Oct 27... 형태 등 모두 처리)
      const dateObj = parseSafeDate(rawDateValue);
      
      // 3. 날짜가 없거나 파싱 불가능하면 필터링 대상에서 제외(안보여줌) 또는 포함(보여줌)
      //    여기서는 날짜 데이터가 없으면 검색 범위 비교가 불가능하므로 제외(false) 처리합니다.
      if (!dateObj) return false;

      // 4. 비교를 위해 row의 날짜를 YYYY-MM-DD 문자열로 변환
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const rowDateStr = `${year}-${month}-${day}`;

      // 5. 문자열 비교 (YYYY-MM-DD 포맷이므로 알파벳순 비교 가능)
      return rowDateStr >= startStr && rowDateStr <= endStr;
    });
  }, [startDate, endDate, searchExecuted, apiData]);
  
  // 정렬 로직
  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key!] ?? '';
        const bValue = b[sortConfig.key!] ?? '';

        // 숫자일 경우 숫자 비교, 아니면 문자열 비교
        // 여기서는 간단히 문자열 비교만 적용
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

  const handleSearch = () => {
    setSearchExecuted(true); 
    setCurrentPage(1);
    console.log(`Searching from ${startDate} to ${endDate}`);
  };

  const handleSort = (key: string) => {
    let direction: SortConfig['direction'] = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); 
  };

  const totalPages = Math.ceil(sortedData.length / ROWS_PER_PAGE) || 1;

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
  
  const handleExport = () => {
    if (sortedData.length === 0) {
      alert("출력할 데이터가 없습니다.");
      return;
    }
    
    const csvData = convertToCSV(columns, sortedData);
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvData], { type: 'text/csv;charset=utf-8;' }); 
    const fileName = `일자별_상세_리스트_${new Date().toISOString().slice(0, 10)}.csv`;

    if (typeof window !== 'undefined' && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, fileName);
    } else if (typeof window !== 'undefined') {
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

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

      <TableContainer>
        <TableViewport>
          {loading ? (
            <InfoMessage>데이터를 불러오는 중입니다...</InfoMessage>
          ) : error ? (
            <InfoMessage>{error}</InfoMessage>
          ) : (
            <Table>
              <thead>
                <Tr>
                  {columns.map((header) => (
                    <Th 
                      key={header}
                      $sortable={true} 
                      onClick={() => handleSort(header)}
                    >
                      {header}
                      {renderSortArrow(header)}
                    </Th>
                  ))}
                </Tr>
              </thead>
              <tbody>
                {currentData.length > 0 ? (
                  currentData.map((row, rowIndex) => (
                    <Tr key={rowIndex}>
                      {columns.map((key) => {
                        const isDateCol = 
                          key === DATE_KEY_NAME || 
                          key.toUpperCase().includes('TIMESTAMP') || 
                          key.toUpperCase().includes('DATE') ||
                          key.includes('일시') ||
                          key.includes('날짜');

                        return (
                          <Td key={key}>
                            {isDateCol 
                              ? formatDateTime(row[key]) 
                              : (row[key] !== undefined && row[key] !== null ? String(row[key]) : '-') 
                            }
                          </Td>
                        );
                      })}
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={columns.length || 1} style={{ textAlign: 'center', padding: '40px' }}>
                      데이터가 없습니다.
                    </Td>
                  </Tr>
                )}
              </tbody>
            </Table>
          )}
        </TableViewport>

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