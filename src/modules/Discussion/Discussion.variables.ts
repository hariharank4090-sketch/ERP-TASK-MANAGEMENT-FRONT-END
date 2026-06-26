// export interface DiscussionData {
//   Id: number;
//   Title: string;
//   Description: string;
//   Category: string;
//   CreatedAt?: string;
//   UpdatedAt?: string;
//   CreatedBy?: string;
//   LikeCount?: number;
//   CommentCount?: number;
//   ViewCount?: number;
//   isLiked?: boolean;
// }

// export interface DiscussionCreateInput {
//   Title: string;
//   Description: string;
//   Category: string;
// }

// export interface MessageData {
//   Id: number;
//   DiscussionId: number;
//   Content: string;
//   SenderId: number;
//   SenderName: string;
//   Timestamp: string;
// }

// export interface MessageSendInput {
//   DiscussionId: number;
//   Content: string;
//   SenderId: number;
//   SenderName: string;
//   Timestamp: string;
// }

// export interface ApiResponse<T = any> {
//   success: boolean;
//   data?: T;
//   message?: string;
//   error?: string;
// }

// // Initial state for discussion form
// export const initialState: DiscussionCreateInput = {
//   Title: '',
//   Description: '',
//   Category: 'General'
// };

// // Initial state for dialogs
// export const dialogInitialState = {
//   createDialog: false,
//   viewDialog: false,
//   editDialog: false,
//   deleteDialog: false,
//   commentDialog: false
// };

// // Mock data for development
// export const mockTopics = [
//   {
//     id: 1,
//     title: "Welcome to Discussion Forum",
//     description: "Introduce yourself and share your thoughts",
//     category: "General",
//     users: 45,
//     comments: 23,
//     likes: 15,
//     edits: 3,
//     created: "2024-01-15T10:30:00Z"
//   },
//   {
//     id: 2,
//     title: "Best Practices for React Development",
//     description: "Share your tips and tricks for React",
//     category: "Technical",
//     users: 89,
//     comments: 42,
//     likes: 67,
//     edits: 5,
//     created: "2024-01-20T14:20:00Z"
//   },
//   {
//     id: 3,
//     title: "UI/UX Design Discussions",
//     description: "Discuss design patterns and user experience",
//     category: "Design",
//     users: 34,
//     comments: 18,
//     likes: 29,
//     edits: 2,
//     created: "2024-01-25T09:15:00Z"
//   }
// ];

// // Success messages
// export const SUCCESS_MESSAGES = {
//   CREATE_SUCCESS: "Discussion created successfully!",
//   UPDATE_SUCCESS: "Discussion updated successfully!",
//   DELETE_SUCCESS: "Discussion deleted successfully!",
//   LIKE_SUCCESS: "Discussion liked!",
//   COMMENT_SUCCESS: "Comment added successfully!",
//   MESSAGE_SENT: "Message sent successfully!",
//   FETCH_SUCCESS: "Data loaded successfully!"
// };

// // Error messages
// export const ERROR_MESSAGES = {
//   FETCH_ERROR: "Failed to load data. Please try again.",
//   CREATE_ERROR: "Failed to create discussion. Please try again.",
//   UPDATE_ERROR: "Failed to update discussion. Please try again.",
//   DELETE_ERROR: "Failed to delete discussion. Please try again.",
//   LIKE_ERROR: "Failed to like discussion. Please try again.",
//   COMMENT_ERROR: "Failed to add comment. Please try again.",
//   MESSAGE_ERROR: "Failed to send message. Please try again.",
//   NETWORK_ERROR: "Network error. Please check your connection.",
//   VALIDATION_ERROR: "Please fill in all required fields."
// };