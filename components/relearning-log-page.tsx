// RelearningLogPage.tsx
"use client";
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { IoIosArrowUp, IoIosArrowDown, IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { IoMdClose } from 'react-icons/io';
import { FaUpload } from "react-icons/fa";
import { LuRefreshCcw, LuFileSpreadsheet } from 'react-icons/lu';

/**
 * 💡 설정 및 상수
 */
const ROWS_PER_PAGE = 14;
const COLUMN_HEADERS = ['재학습 시간', '상태', '학습 파일', '데이터 수량', '사용 모델'];
const SORTABLE_COLUMNS = ['재학습 시간', '상태', '데이터 수량'];

const COLUMN_KEY_MAP = {
  '재학습 시간': 'time',
  '상태': 'status',
  '학습 파일': 'file',
  '데이터 수량': 'dataCount',
  '사용 모델': 'model',
} as const;

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

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 🎨 Styled Components 정의
 */

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

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

const UploadArea = styled.div<{ $isDragging: boolean; $hasFile: boolean }>`
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
  transition: all 0.3s ease-in-out;
`;

const UploadPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  width: 100%;
  animation: ${fadeIn} 0.5s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
`;

const UploadIcon = styled(FaUpload)`
  font-size: 2.5rem;
  color: #cccccc;
  transition: color 0.3s;
  ${UploadArea}:hover & { color: #b0b0b0; }
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

const FileSelectButton = styled.button`
  padding: 10px 20px;
  background-color: #ffffff;
  color: #ff5a5f;
  border: 1px solid #ff5a5f;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  &:hover { background-color: #fff0f0; transform: translateY(-1px); box-shadow: 0 2px 5px rgba(255, 90, 95, 0.2); }
  &:active { transform: translateY(0); }
`;

const FileInfoCard = styled.div`
  width: 100%;
  max-width: 100%; 
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  animation: ${fadeIn} 0.5s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
`;

const FileInfoLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  overflow: hidden;
`;

const FileIconBox = styled.div`
  width: 44px;
  height: 44px;
  background-color: #e8f5e9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2e7d32;
  font-size: 1.4rem;
  flex-shrink: 0;
`;

const FileMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
`;

const FileNameText = styled.span`
  font-size: 0.95rem;
  font-weight: 600;
  color: #333333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FileSizeText = styled.span`
  font-size: 0.8rem;
  color: #888888;
`;

const DeleteButtonStyled = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffebee;
  color: #d32f2f;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-left: 12px;
  font-size: 1.2rem;
  &:hover { background-color: #ffcdd2; transform: scale(1.05); }
  &:active { transform: scale(0.95); }
`;

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
  transition: all 0.2s;
  box-shadow: 0 4px 6px rgba(255, 90, 95, 0.3);
  &:hover { background-color: #e04f51; transform: translateY(-2px); box-shadow: 0 6px 8px rgba(255, 90, 95, 0.4); }
  &:active { transform: translateY(0); box-shadow: 0 4px 6px rgba(255, 90, 95, 0.3); }
  &:disabled { background-color: #ff9e9e; cursor: not-allowed; transform: none; box-shadow: none; }
`;

const UploadFooter = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 20px;
`;

// --- 2. 재학습 로그 테이블 스타일 ---
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
  &:hover { background-color: ${(props) => (props.$sortable ? '#efefef' : '#f7f7f7')}; }
  &:last-child { border-right: none; }
`;

const Td = styled.td`
  padding: 10px 16px;
  text-align: left;
  white-space: nowrap;
  border-right: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  color: #555555;
  &:last-child { border-right: none; }
`;

const Tr = styled.tr`
  transition: background-color 0.15s;
  &:nth-child(even) { background-color: #fcfcfc; }
  &:hover { background-color: #f5f5f5; }
  &:last-child ${Td} { border-bottom: none; }
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
      case '완료': return css`background-color: #4CAF50;`;
      case '실패': return css`background-color: #F44336;`;
      case '진행중': return css`background-color: #2196F3;`;
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
  &:hover:not(:disabled) { background-color: ${(props) => (props.$active ? '#e04f51' : '#f0f0f0')}; }
  &:disabled { cursor: not-allowed; opacity: 0.5; }
`;


/**
 * ⚛️ React 컴포넌트 (RelearningLogPage)
 */
const RelearningLogPage: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [logData, setLogData] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(false); // 리스트 로딩
  const [uploading, setUploading] = useState(false); // 업로드 로딩
  const [apiError, setApiError] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '재학습 시간', direction: 'descending' });
  
  const inputRef = useRef<HTMLInputElement>(null);

  // ✅ [리팩토링] 로그 조회 함수 (재사용을 위해 분리)
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setApiError(false);
    try {
      const response = await fetch("http://1.254.24.170:24828/api/DX_API002008", {
        method: "GET", 
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        console.warn(`API Error ${response.status}: Failed to fetch logs.`);
        setApiError(true);
        return;
      }

      const result = await response.json();
      const rows = Array.isArray(result) ? result : (result.rows || []);

      const mappedData: LogItem[] = rows.map((r: any, idx: number) => {
        let statusText: LogItem['status'] = '진행중';
        const s = String(r.status || r.STATUS || '').trim();
        
        if (s === 'SUCCESS' || s === 'S' || s === '완료') statusText = '완료';
        else if (s === 'FAIL' || s === 'F' || s === '실패') statusText = '실패';
        else statusText = '진행중';

        return {
          id: r.id || idx,
          time: r.train_time || r.REG_DT || '0000-00-00 00:00:00',
          status: statusText,
          file: r.train_file || r.FILE_NAME || 'unknown.csv',
          dataCount: Number(r.data_num || r.ROW_COUNT || 0),
          model: r.model_name || r.MODEL_NAME || '-',
        };
      });

      setLogData(mappedData);
    } catch (error) {
      console.error("Failed to fetch log data:", error);
      setApiError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 로드 시 실행
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);


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

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (inputRef.current) {
        inputRef.current.value = "";
    }
  };

  // ✅ [수정] 파일 업로드 API 연동
  const handleRelearn = async () => {
    if (!selectedFile) {
      alert("파일을 선택해주세요.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('csvFile', selectedFile);

      const response = await fetch('http://1.254.24.170:24828/api/DX_API002005', {
        method: 'POST',
        body: formData,
        // ⚠️ FormData 전송 시 Content-Type 헤더는 브라우저가 자동 설정하므로 명시하지 않음
      });

      if (!response.ok) {
        throw new Error(`Upload Failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Upload Result:', data);

      // 성공 처리
      alert("재학습이 완료되었습니다!");
      
      // 파일 선택 초기화
      handleRemoveFile();
      
      // 로그 목록 새로고침
      fetchLogs();

    } catch (error) {
      console.error('Relearn error:', error);
      alert("재학습 요청 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };


  // --- 2. 로그 테이블 로직 (정렬 및 페이지네이션) ---
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

  const handleSort = (key: string) => {
    let direction: SortConfig['direction'] = 'ascending';
    
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
    setCurrentPage(1);
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
      
      <UploadArea 
        $isDragging={dragActive}
        $hasFile={!!selectedFile}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {!selectedFile ? (
          <UploadPlaceholder key="placeholder">
            <UploadIcon />
            <UploadText>
              파일을 드래그하여 놓거나 클릭하여 선택하세요
            </UploadText>
            <SupportedFilesText>
              CSV 또는 엑셀 파일 업로드가 가능합니다 (.csv, .xlsx, .xls)
            </SupportedFilesText>
            
            <input 
              ref={inputRef} 
              type="file" 
              accept=".csv, .xlsx, .xls" 
              style={{ display: 'none' }} 
              onChange={handleChange} 
            />
            
            <FileSelectButton onClick={onButtonClick}>
              파일 선택
            </FileSelectButton>
          </UploadPlaceholder>
        ) : (
          <FileInfoCard key="file-info">
             <FileInfoLeft>
               <FileIconBox>
                 <LuFileSpreadsheet />
               </FileIconBox>
               <FileMeta>
                 <FileNameText title={selectedFile.name}>{selectedFile.name}</FileNameText>
                 <FileSizeText>{formatFileSize(selectedFile.size)}</FileSizeText>
               </FileMeta>
             </FileInfoLeft>
             {/* 업로드 중에는 삭제 버튼 비활성화 */}
             <DeleteButtonStyled onClick={handleRemoveFile} disabled={uploading}>
               <IoMdClose />
             </DeleteButtonStyled>
          </FileInfoCard>
        )}
      </UploadArea>

      <UploadFooter>
        <RelearnButton onClick={handleRelearn} disabled={uploading}>
          <LuRefreshCcw size={18} style={{ marginRight: '8px' }}/>
          {uploading ? '업로드 중...' : '재학습'}
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
              {loading ? (
                 <Tr>
                   <Td colSpan={COLUMN_HEADERS.length} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                     데이터를 불러오는 중입니다...
                   </Td>
                 </Tr>
              ) : apiError ? (
                <Tr>
                  <Td colSpan={COLUMN_HEADERS.length} style={{ textAlign: 'center', padding: '40px', color: '#F44336' }}>
                    데이터를 불러오는 데 실패했습니다. (API Error)
                  </Td>
                </Tr>
              ) : currentData.length === 0 ? (
                <Tr>
                  <Td colSpan={COLUMN_HEADERS.length} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    데이터가 없습니다.
                  </Td>
                </Tr>
              ) : (
                currentData.map((log) => (
                  <Tr key={log.id}>
                    <Td>{log.time}</Td>
                    <Td>
                      <StatusTag status={log.status}>{log.status}</StatusTag>
                    </Td>
                    <Td>{log.file}</Td>
                    <Td>{log.dataCount.toLocaleString()}</Td>
                    <Td>{log.model}</Td>
                  </Tr>
                ))
              )}
            </tbody>
          </Table>
        </TableWrapper>

        {/* 푸터 (페이지네이션) */}
        {!loading && !apiError && currentData.length > 0 && (
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
        )}
      </TableContainer>
    </PageContainer>
  );
};

export default RelearningLogPage;