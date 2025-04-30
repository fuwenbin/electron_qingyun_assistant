import RPCClient from '@alicloud/pop-core';
import { COMMON_CONFIG } from './aliyun-config';

export async function getToken() {
  const client: any = new RPCClient({
    accessKeyId: COMMON_CONFIG.accessKeyId,
    accessKeySecret: COMMON_CONFIG.accessKeySecret,
    endpoint: 'http://nls-meta.cn-shanghai.aliyuncs.com',
    apiVersion: '2019-02-28'
  });
  try {
    const result = await client.request('CreateToken');
    return result.Token.Id;
  } catch (error) {
    console.error('Error creating token:', error);
    return null;
  }
}