/**
 * Ant Design Vue 全局函数 Polyfill
 * 修复在 Electron 打包环境中 getRootPrefixCls 等函数不存在的问题
 */

// 确保在所有环境中都有这些全局函数
export function initAntdGlobalFunctions() {
  // 检查并初始化 getRootPrefixCls
  if (typeof globalThis !== 'undefined' && !(globalThis as any).getRootPrefixCls) {
    (globalThis as any).getRootPrefixCls = (suffixCls?: string, customizePrefixCls?: string) => {
      if (customizePrefixCls) {
        return customizePrefixCls;
      }
      return suffixCls ? `ant-${suffixCls}` : 'ant';
    };
  }
  
  // 检查并初始化 getIconPrefixCls
  if (typeof globalThis !== 'undefined' && !(globalThis as any).getIconPrefixCls) {
    (globalThis as any).getIconPrefixCls = () => 'anticon';
  }
  
  // 为了兼容性，也在 window 对象上设置（如果存在）
  if (typeof window !== 'undefined') {
    if (!(window as any).getRootPrefixCls) {
      (window as any).getRootPrefixCls = (globalThis as any).getRootPrefixCls;
    }
    if (!(window as any).getIconPrefixCls) {
      (window as any).getIconPrefixCls = (globalThis as any).getIconPrefixCls;
    }
  }
}

// 立即执行初始化
initAntdGlobalFunctions();
