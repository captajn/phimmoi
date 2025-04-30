import React from 'react';

interface WatchDetailErrorProps {
  error: string;
  slug: string;
  errorCode: string;
  onRetry: () => void;
  onChangeServer: () => void;
  hasAlternateServers: boolean;
}

export const WatchDetailError: React.FC<WatchDetailErrorProps> = ({
  error,
  slug,
  errorCode,
  onRetry,
  onChangeServer,
  hasAlternateServers
}) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-10">
      <div className="bg-[#1a1b1f] p-5 rounded-lg max-w-lg w-full mx-4 shadow-xl border border-red-600">
        <div className="flex items-center justify-center text-red-500 mb-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        
        <h3 className="text-lg font-medium text-white text-center mb-2">
          Không thể phát video
        </h3>
        
        <p className="text-white/80 text-sm text-center mb-4">
          {error}
        </p>
        
        <div className="text-xs text-gray-400 text-center mb-4">
          Mã lỗi: {errorCode} | ID: {slug.slice(0, 10)}
        </div>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={onRetry}
            className="w-full py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-black rounded-md font-medium transition-colors"
          >
            Thử lại
          </button>
          
          {hasAlternateServers && (
            <button
              onClick={onChangeServer}
              className="w-full py-2 px-4 bg-[#2a2c31] hover:bg-[#3a3c41] text-white rounded-md font-medium transition-colors"
            >
              Chuyển server
            </button>
          )}
          
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
          >
            Tải lại trang
          </button>
          
          <div className="mt-2 pt-2 border-t border-gray-700">
            <p className="text-xs text-gray-400 text-center">
              Gợi ý: Kiểm tra kết nối mạng, thử server khác hoặc quay lại sau ít phút
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 