/**
 * 后台脚本入口点。
 * 处理消息路由并管理扩展的生命周期。
 */
import { browser } from 'wxt/browser';
import type { AnalysisResponse, RequestMessage } from '@/types';
import { analyzeTechStack } from './analyze';

/**
 * 初始化后台脚本逻辑。
 * 设置消息监听器。
 */
export function initializeBackground() {
  /**
   * 监听来自内容脚本或弹出框的消息。
   */
  browser.runtime.onMessage.addListener(
    (
      message: RequestMessage,
      _sender,
      sendResponse: (response: AnalysisResponse | { success: boolean; value: boolean }) => void,
    ) => {
      if (message.action === 'analyzeTechStack') {
        const requestUrl = message.url || '';
        if (!requestUrl) {
          console.error('[Background] 缺少 URL 参数');
          sendResponse({ success: false, error: '缺少 URL 参数' });
          return;
        }
        analyzeTechStack(requestUrl)
          .then((res) => {
            console.log('[Background] 分析完成:', res);
            sendResponse(res);
          })
          .catch((err) => {
            console.error('[Background] 分析异常:', err);
            sendResponse({ success: false, error: err.message });
          });
        return true; // 表示异步响应
      }
    },
  );
}
