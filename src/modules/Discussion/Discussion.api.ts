// import axios from 'axios';
// import type { 
//   DiscussionData,
//   DiscussionCreateInput,
//   MessageData,
//   MessageSendInput,
//   ApiResponse
// } from './Discussion.variables';

// // Create axios instance with proper configuration
// const api = axios.create({
//   baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api',
//   timeout: parseInt(process.env.REACT_APP_API_TIMEOUT || '10000'),
//   headers: {
//     'Content-Type': 'application/json',
//   }
// });

// // Add request interceptor for loading states
// api.interceptors.request.use(
//   (config) => {
//     // You can add auth tokens here if needed
//     // const token = localStorage.getItem('token');
//     // if (token) {
//     //   config.headers.Authorization = `Bearer ${token}`;
//     // }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Add response interceptor
// api.interceptors.response.use(
//   (response) => response.data,
//   (error) => {
//     console.error('API Error:', error);
//     throw error;
//   }
// );

// export const getDiscussions = async (
//   loadingOn?: () => void,
//   loadingOff?: () => void
// ): Promise<DiscussionData[]> => {
//   try {
//     loadingOn?.();
//     const response = await api.get<ApiResponse<DiscussionData[]>>('/discussions');
//     return response.data || [];
//   } catch (error) {
//     console.error('Error fetching discussions:', error);
//     throw new Error('Failed to fetch discussions');
//   } finally {
//     loadingOff?.();
//   }
// };

// export const createDiscussion = async (
//   data: DiscussionCreateInput,
//   loadingOn?: () => void,
//   loadingOff?: () => void
// ): Promise<ApiResponse<DiscussionData>> => {
//   try {
//     loadingOn?.();
//     const response = await api.post<ApiResponse<DiscussionData>>('/discussions', data);
//     return response;
//   } catch (error) {
//     console.error('Error creating discussion:', error);
//     throw new Error('Failed to create discussion');
//   } finally {
//     loadingOff?.();
//   }
// };

// export const updateDiscussion = async (
//   data: DiscussionCreateInput & { Id: number },
//   loadingOn?: () => void,
//   loadingOff?: () => void
// ): Promise<ApiResponse<DiscussionData>> => {
//   try {
//     loadingOn?.();
//     const response = await api.put<ApiResponse<DiscussionData>>(`/discussions/${data.Id}`, data);
//     return response;
//   } catch (error) {
//     console.error('Error updating discussion:', error);
//     throw new Error('Failed to update discussion');
//   } finally {
//     loadingOff?.();
//   }
// };

// export const deleteDiscussion = async (
//   id: number,
//   loadingOn?: () => void,
//   loadingOff?: () => void
// ): Promise<ApiResponse<boolean>> => {
//   try {
//     loadingOn?.();
//     const response = await api.delete<ApiResponse<boolean>>(`/discussions/${id}`);
//     return response;
//   } catch (error) {
//     console.error('Error deleting discussion:', error);
//     throw new Error('Failed to delete discussion');
//   } finally {
//     loadingOff?.();
//   }
// };

// export const getDiscussionMessages = async (
//   discussionId: number,
//   loadingOn?: () => void,
//   loadingOff?: () => void
// ): Promise<MessageData[]> => {
//   try {
//     loadingOn?.();
//     const response = await api.get<ApiResponse<MessageData[]>>(`/discussions/${discussionId}/messages`);
//     return response.data || [];
//   } catch (error) {
//     console.error('Error fetching messages:', error);
//     throw new Error('Failed to fetch messages');
//   } finally {
//     loadingOff?.();
//   }
// };

// export const sendMessage = async (
//   data: MessageSendInput,
//   loadingOn?: () => void,
//   loadingOff?: () => void
// ): Promise<ApiResponse<MessageData>> => {
//   try {
//     loadingOn?.();
//     const response = await api.post<ApiResponse<MessageData>>(`/discussions/${data.DiscussionId}/messages`, data);
//     return response;
//   } catch (error) {
//     console.error('Error sending message:', error);
//     throw new Error('Failed to send message');
//   } finally {
//     loadingOff?.();
//   }
// };

// export const likeDiscussion = async (
//   discussionId: number,
//   loadingOn?: () => void,
//   loadingOff?: () => void
// ): Promise<ApiResponse<boolean>> => {
//   try {
//     loadingOn?.();
//     const response = await api.post<ApiResponse<boolean>>(`/discussions/${discussionId}/like`);
//     return response;
//   } catch (error) {
//     console.error('Error liking discussion:', error);
//     throw new Error('Failed to like discussion');
//   } finally {
//     loadingOff?.();
//   }
// };

// export const commentDiscussion = async (
//   discussionId: number,
//   comment: string,
//   loadingOn?: () => void,
//   loadingOff?: () => void
// ): Promise<ApiResponse<boolean>> => {
//   try {
//     loadingOn?.();
//     const response = await api.post<ApiResponse<boolean>>(`/discussions/${discussionId}/comment`, { comment });
//     return response;
//   } catch (error) {
//     console.error('Error adding comment:', error);
//     throw new Error('Failed to add comment');
//   } finally {
//     loadingOff?.();
//   }
// };

// export default api;