import { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

export const InAppBrowserWarning = () => {
  const [isInApp, setIsInApp] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    const rules = [
      'WebView',
      '(iPhone|iPod|iPad)(?!.*Safari\\/)',
      'Android.*(wv|\\.0\\.0\\.0)',
      'FBAV', 'FBAN', 'Instagram',
      'Zalo', 'Viber', 'Line', 'MicroMessenger', 'Snapchat', 'Twitter',
    ];
    const regex = new RegExp(`(${rules.join('|')})`, 'ig');
    
    if (ua.match(regex)) {
      setIsInApp(true);
    }
  }, []);

  if (!isInApp) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 text-center border border-gray-100 dark:border-gray-800"
      >
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-500" />
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Trình duyệt không được hỗ trợ
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm leading-relaxed">
          Bạn đang mở ứng dụng bên trong một trình duyệt nhúng (như Zalo, Messenger). Việc đăng nhập bằng Google và một số tính năng có thể gặp lỗi bảo mật.
        </p>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-100 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-3 text-left">
            Vui lòng làm theo hướng dẫn:
          </p>
          <ol className="text-sm text-gray-600 dark:text-gray-300 text-left list-decimal list-inside space-y-2">
            <li>Nhấn vào biểu tượng dấu 3 chấm <span className="font-bold text-gray-900 dark:text-white">...</span> ở góc phải (hoặc góc dưới) màn hình</li>
            <li>Chọn <span className="font-bold text-blue-600 dark:text-blue-400">"Mở bằng trình duyệt"</span> (Open in Safari/Chrome/Browser)</li>
          </ol>
        </div>

        <button 
          onClick={() => setIsInApp(false)}
          className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
        >
          Tôi đã hiểu, bỏ qua cảnh báo
        </button>
      </motion.div>
    </div>
  );
};
