import WebSocket from 'ws';
import CryptoJS from 'crypto-js';

interface TTSConfig {
  apiKey: string;
  apiSecret: string;
  appId: string;
  text: string;
  voice?: string;
}

export class XFYunTTS {
  private ws: WebSocket | null = null;

  constructor(private config: TTSConfig) {}

  // 初始化 WebSocket 连接
  async connect(onAudioData: (data: ArrayBuffer) => void, onError: (err: Error) => void) {
    // 1. 获取 WebSocket URL（通常讯飞会提供一个鉴权 URL）
    const wsUrl = await this.getWebSocketUrl();

    // 2. 初始化 WebSocket
    if (typeof window !== 'undefined' && 'WebSocket' in window) {
      // 浏览器环境
      this.ws = new WebSocket(wsUrl);
    } else {
      // Node.js 或 Electron 主进程环境
      this.ws = new WebSocket(wsUrl);
    }

    this.ws.onopen = () => {
      console.log('WebSocket 连接成功');
      this.sendText(this.config.text);
    };

    this.ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        onAudioData(event.data);
      } else {
        const data = JSON.parse(event.data.toString());
        if (data.code !== 0) {
          onError(new Error(`语音合成失败: ${data.message}`));
        }
      }
    };

    this.ws.onerror = (err) => {
      onError(new Error(`WebSocket 错误: ${err.message}`));
    };
  }

  // 发送文本进行合成
  sendText(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket 未连接');
    }
    const payload = {
      text,
      voice: this.config.voice || 'xiaoyan',
    };
    this.ws.send(JSON.stringify(payload));
  }

  // 关闭连接
  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // 获取 WebSocket URL（需替换为讯飞实际的鉴权逻辑）
  private async getWebSocketUrl(): Promise<string> {
    var url = "wss://tts-api.xfyun.cn/v2/tts";
    var host = location.host;
    var date = new Date().toISOString();
    var algorithm = "hmac-sha256";
    var headers = "host date request-line";
    var signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/tts HTTP/1.1`;
    var signatureSha = CryptoJS.HmacSHA256(signatureOrigin, this.config.apiSecret);
    var signature = CryptoJS.enc.Base64.stringify(signatureSha);
    var authorizationOrigin = `api_key="${this.config.apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`;
    var authorization = btoa(authorizationOrigin);
    url = `${url}?authorization=${authorization}&date=${date}&host=${host}`;
    return url;
  }
}