import axios, {AxiosError, type AxiosResponse} from "axios";
import { type FlowResponse } from "../api/FlowResponse.ts";

export const restAxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 1000 * 15, // 15 秒超时
});

// 不做 response 拦截
export const blobAxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 1000 * 15, // 15 秒超时
});

restAxiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    globalErrorResponseInterceptor,
)

function globalErrorResponseInterceptor(error: AxiosError):Promise<Error> {
    // 超出 2xx 范围的状态码（如4xx, 5xx）或网络错误等都会触发该函数
    // 对响应错误做点什么，这是统一错误处理的核心
    let errorMessage: string;
    let httpStatus = null;
    let businessCode = null;

    if (error.response) {
        // 请求已发出，且服务器响应的状态码非 2xx
        httpStatus = error.response.status;
        try {
            // 尝试获取并转换错误响应体
            const flowResponse = error.response.data as FlowResponse<null>;
            // 使用接口类型确保我们获取的是正确的结构
            errorMessage = flowResponse.message || `请求失败，状态码: ${httpStatus}`;
        } catch (e) {
            // 如果响应体不是预期的JSON格式，使用默认错误处理
            errorMessage = `请求失败，状态码: ${httpStatus}`;
        }
    } else if (error.request) {
        // 请求已经成功发起，但没有收到响应
        // `error.request` 在浏览器中是 XMLHttpRequest 的实例
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            errorMessage = '请求超时，请检查网络或稍后再试';
        } else {
            errorMessage = '网络异常，无法连接服务器';
        }
    } else {
        // 发送请求时出了点问题，触发了AxiosError（如配置错误等）
        errorMessage = error.message || '发起请求时发生未知错误';
    }

    // console.error(`请求失败: ${errorMessage}`, error);

    // 创建一个增强的错误对象，携带更多信息用于抛出
    const enhancedError = new Error(errorMessage);
    // 可以给错误对象附加更多属性，方便后续catch块识别处理
    enhancedError.cause = {
        originalError: error,
        httpStatus,
        businessCode,
        isAxiosError: true, // 或使用 axios.isAxiosError(error) 判断
    };
    // 抛出错误，后续的catch块会捕获到它
    return Promise.reject(enhancedError);
}