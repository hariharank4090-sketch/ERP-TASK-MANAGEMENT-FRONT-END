// import React from "react";
// import {
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Button,
//   TextField,
//   Select,
//   MenuItem,
//   FormControl,
//   InputLabel,
//   Typography,
//   Box,
//   Alert,
//   CircularProgress,
// } from "@mui/material";
// import {
//   VALIDATION_MESSAGES,
//   COLORS,
// } from "./Discussion.variables";
// import type {
//   DiscussionCreateInput,
//   MessageData,
// } from "./Discussion.variables";

// interface DiscussionDialogProps {
//   open: boolean;
//   onClose: () => void;
//   onSubmit: (data?: any) => void;
//   type: "create" | "edit" | "view" | "delete" | "comment";
//   discussionObj?: DiscussionCreateInput;
//   setDiscussionObj?: React.Dispatch<React.SetStateAction<DiscussionCreateInput>>;
//   selectedId?: number | null;
//   messages?: MessageData[];
//   isLoading?: boolean;
// }

// const DiscussionDialog: React.FC<DiscussionDialogProps> = ({
//   open,
//   onClose,
//   onSubmit,
//   type,
//   discussionObj = { Title: "", Description: "", Category: "General" },
//   setDiscussionObj,
//   selectedId,
//   messages = [],
//   isLoading = false,
// }) => {
//   const [comment, setComment] = React.useState("");
//   const [errors, setErrors] = React.useState<Record<string, string>>({});

//   // Handle input changes for create/edit
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
//     const { name, value } = e.target;
//     if (setDiscussionObj && name) {
//       setDiscussionObj((prev) => ({
//         ...prev,
//         [name]: value,
//       }));
//       // Clear error when user starts typing
//       if (errors[name]) {
//         setErrors((prev) => ({ ...prev, [name]: "" }));
//       }
//     }
//   };

//   // Handle comment change
//   const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setComment(e.target.value);
//   };

//   // Validate form
//   const validateForm = (): boolean => {
//     const newErrors: Record<string, string> = {};

//     if (type === "create" || type === "edit") {
//       if (!discussionObj.Title.trim()) {
//         newErrors.Title = VALIDATION_MESSAGES.TITLE_REQUIRED;
//       } else if (discussionObj.Title.length < 3) {
//         newErrors.Title = VALIDATION_MESSAGES.TITLE_MIN_LENGTH;
//       } else if (discussionObj.Title.length > 100) {
//         newErrors.Title = VALIDATION_MESSAGES.TITLE_MAX_LENGTH;
//       }

//       if (!discussionObj.Description.trim()) {
//         newErrors.Description = VALIDATION_MESSAGES.DESCRIPTION_REQUIRED;
//       } else if (discussionObj.Description.length < 10) {
//         newErrors.Description = VALIDATION_MESSAGES.DESCRIPTION_MIN_LENGTH;
//       } else if (discussionObj.Description.length > 500) {
//         newErrors.Description = VALIDATION_MESSAGES.DESCRIPTION_MAX_LENGTH;
//       }
//     }

//     if (type === "comment") {
//       if (!comment.trim()) {
//         newErrors.comment = VALIDATION_MESSAGES.MESSAGE_REQUIRED;
//       } else if (comment.length > 1000) {
//         newErrors.comment = VALIDATION_MESSAGES.MESSAGE_MAX_LENGTH;
//       }
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   // Handle submit
//   const handleSubmit = () => {
//     if (!validateForm()) {
//       return;
//     }

//     if (type === "comment") {
//       onSubmit(comment);
//       setComment("");
//     } else {
//       onSubmit();
//     }
//   };

//   // Get dialog title
//   const getDialogTitle = () => {
//     switch (type) {
//       case "create":
//         return "Create New Discussion";
//       case "edit":
//         return "Edit Discussion";
//       case "view":
//         return "Discussion Details";
//       case "delete":
//         return "Confirm Delete";
//       case "comment":
//         return "Add Comment";
//       default:
//         return "Discussion";
//     }
//   };

//   // Get submit button text
//   const getSubmitButtonText = () => {
//     switch (type) {
//       case "create":
//         return "Create";
//       case "edit":
//         return "Update";
//       case "delete":
//         return "Delete";
//       case "comment":
//         return "Post Comment";
//       default:
//         return "Submit";
//     }
//   };

//   // Render content based on dialog type
//   const renderContent = () => {
//     switch (type) {
//       case "create":
//       case "edit":
//         return (
//           <>
//             <TextField
//               fullWidth
//               label="Title"
//               name="Title"
//               value={discussionObj.Title}
//               onChange={handleChange}
//               error={!!errors.Title}
//               helperText={errors.Title}
//               margin="normal"
//               required
//             />
            
//             <FormControl fullWidth margin="normal">
//               <InputLabel>Category *</InputLabel>
//               <Select
//                 name="Category"
//                 value={discussionObj.Category}
//                 onChange={handleChange}
//                 label="Category *"
//               >
//                 {discussionCategories.map((category) => (
//                   <MenuItem key={category.value} value={category.value}>
//                     {category.label}
//                   </MenuItem>
//                 ))}
//               </Select>
//             </FormControl>

//             <TextField
//               fullWidth
//               label="Description"
//               name="Description"
//               value={discussionObj.Description}
//               onChange={handleChange}
//               error={!!errors.Description}
//               helperText={errors.Description}
//               margin="normal"
//               multiline
//               rows={4}
//               required
//             />
//           </>
//         );

//       case "view":
//         return (
//           <Box>
//             <Typography variant="h6" gutterBottom>
//               {discussionObj.Title}
//             </Typography>
            
//             <Box sx={{ mb: 2 }}>
//               <Typography variant="subtitle2" color="textSecondary">
//                 Category: {discussionObj.Category}
//               </Typography>
//             </Box>

//             <Typography variant="body1" paragraph>
//               {discussionObj.Description}
//             </Typography>

//             {messages.length > 0 && (
//               <Box sx={{ mt: 3 }}>
//                 <Typography variant="h6" gutterBottom>
//                   Messages ({messages.length})
//                 </Typography>
//                 <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
//                   {messages.map((message) => (
//                     <Box
//                       key={message.Id}
//                       sx={{
//                         p: 2,
//                         mb: 1,
//                         bgcolor: COLORS.chatBackground,
//                         borderRadius: 1,
//                         borderLeft: `3px solid ${COLORS.primary}`,
//                       }}
//                     >
//                       <Box sx={{ display: "flex", justifyContent: "space-between" }}>
//                         <Typography variant="subtitle2" fontWeight="bold">
//                           {message.SenderName || `User ${message.SenderId}`}
//                         </Typography>
//                         <Typography variant="caption" color="textSecondary">
//                           {new Date(message.Timestamp).toLocaleString()}
//                         </Typography>
//                       </Box>
//                       <Typography variant="body2" sx={{ mt: 1 }}>
//                         {message.Content}
//                       </Typography>
//                       {message.IsEdited && (
//                         <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
//                           (edited)
//                         </Typography>
//                       )}
//                     </Box>
//                   ))}
//                 </Box>
//               </Box>
//             )}
//           </Box>
//         );

//       case "delete":
//         return (
//           <Alert severity="warning" sx={{ mb: 2 }}>
//             Are you sure you want to delete this discussion? This action cannot be undone.
//           </Alert>
//         );

//       case "comment":
//         return (
//           <TextField
//             fullWidth
//             label="Your Comment"
//             value={comment}
//             onChange={handleCommentChange}
//             error={!!errors.comment}
//             helperText={errors.comment}
//             margin="normal"
//             multiline
//             rows={4}
//             required
//           />
//         );

//       default:
//         return null;
//     }
//   };

//   return (
//     <Dialog
//       open={open}
//       onClose={onClose}
//       maxWidth={type === "view" ? "md" : "sm"}
//       fullWidth
//     >
//       <DialogTitle sx={{ bgcolor: COLORS.primary, color: "#fff" }}>
//         {getDialogTitle()}
//       </DialogTitle>
      
//       <DialogContent sx={{ mt: 2 }}>
//         {isLoading ? (
//           <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
//             <CircularProgress />
//           </Box>
//         ) : (
//           renderContent()
//         )}
//       </DialogContent>
      
//       <DialogActions sx={{ p: 2 }}>
//         <Button onClick={onClose} color="inherit">
//           {type === "view" ? "Close" : "Cancel"}
//         </Button>
        
//         {(type === "create" || type === "edit" || type === "delete" || type === "comment") && (
//           <Button
//             onClick={handleSubmit}
//             variant="contained"
//             color={
//               type === "delete" ? "error" : 
//               type === "comment" ? "info" : "primary"
//             }
//             disabled={isLoading}
//             sx={{
//               bgcolor: type === "delete" ? COLORS.error : COLORS.primary,
//               "&:hover": {
//                 bgcolor: type === "delete" ? "#d32f2f" : COLORS.primaryDark,
//               },
//             }}
//           >
//             {getSubmitButtonText()}
//           </Button>
//         )}
//       </DialogActions>
//     </Dialog>
//   );
// };

// export default DiscussionDialog; // Make sure this export is present