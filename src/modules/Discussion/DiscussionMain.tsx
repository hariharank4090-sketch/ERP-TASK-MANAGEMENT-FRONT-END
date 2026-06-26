// import React from "react";
// import {
//   Box,
//   Typography,
//   TextField,
//   Button,
//   Card,
//   IconButton,
//   InputAdornment,
//   Divider,
// } from "@mui/material";

// import SearchIcon from "@mui/icons-material/Search";
// import VisibilityIcon from "@mui/icons-material/Visibility";
// import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
// import FavoriteIcon from "@mui/icons-material/Favorite";
// import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
// import ThumbUpAltOutlinedIcon from "@mui/icons-material/ThumbUpAltOutlined";
// import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
// import SendIcon from "@mui/icons-material/Send";
// import TuneIcon from "@mui/icons-material/Tune";
// import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

// const topics = Array.from({ length: 8 });

// export default function DiscussionPage() {
//   return (
//     <Box
//       sx={{
//         p: 2,
//         background: "#fff8f8ff",
//         height: "100vh",
//         overflow: "hidden",
//       }}
//     >
//       {/* ================= HEADER ================= */}
//       <Box
//         display="flex"
//         justifyContent="space-between"
//         alignItems="center"
//         mb={2}
//       >
//         <Typography fontWeight={600}>DISCUSSIONS</Typography>

//         <Box display="flex" alignItems="center" gap={1.5}>
//           <TextField
//             size="small"
//             placeholder="Search"
//             sx={{
//               width: 220,
//               background: "#fff",
//               borderRadius: 2,
//             }}
//             InputProps={{
//               startAdornment: (
//                 <InputAdornment position="start">
//                   <SearchIcon />
//                 </InputAdornment>
//               ),
//             }}
//           />

//           <IconButton
//             sx={{
//               border: "1px solid #e0b77a",
//               borderRadius: 2,
//             }}
//           >
//             <TuneIcon />
//           </IconButton>

//           <Button
//             variant="contained"
//             sx={{
//               background: "#caa56a",
//               "&:hover": { background: "#b8955e" },
//               borderRadius: 2,
//               fontWeight: 600,
//               px: 2,
//             }}
//           >
//             CREATE TOPICS
//           </Button>
//         </Box>
//       </Box>

//       <Divider sx={{ mb: 2 }} />

//       {/* ================= BODY ================= */}
//       <Box display="flex" gap={2} height="calc(100% - 80px)">
//         {/* ================= LEFT : TOPICS ================= */}
//         <Box
//           flex={3}
//           sx={{
//             overflowY: "auto",
//             pr: 1,
//           }}
//         >
//           {/* TOPICS HEADER ROW */}
//           <Box
//             display="flex"
//             justifyContent="space-between"
//             alignItems="center"
//             mb={1}
//           >
//             <Typography fontWeight={600}>TOPICS</Typography>

//             {/* ✅ RECENT WITH ICON */}
//             <Box
//               display="flex"
//               alignItems="center"
//               sx={{
//                 cursor: "pointer",
//                 color: "#666",
//               }}
//             >
//               <Typography variant="body2">Recent</Typography>
//               <KeyboardArrowDownIcon fontSize="small" />
//             </Box>
//           </Box>

//           {/* TOPIC CARDS */}
//           {topics.map((_, index) => (
//             <Card
//               key={index}
//               sx={{
//                 mb: 2,
//                 p: 2,
//                 borderRadius: 3,
//                 border: "1px solid #e0b77a",
//               }}
//             >
//               <Box display="flex" justifyContent="space-between">
//                 <Box>
//                   <Typography fontWeight={700}>
//                     DBMS & ERP WORKS
//                   </Typography>

//                   <Typography
//                     variant="body2"
//                     color="text.secondary"
//                     mt={0.5}
//                   >
//                     THE DISCUSSION FORUM FOR THE PROJECT: DBMS & ERP WORK
//                   </Typography>

//                   {/* STATS */}
//                   <Box display="flex" gap={2} mt={1}>
//                     <Stat icon={<PeopleAltOutlinedIcon />} value="2" />
//                     <Stat
//                       icon={<ChatBubbleOutlineIcon />}
//                       value="5"
//                     />
//                     <Stat
//                       icon={<ThumbUpAltOutlinedIcon />}
//                       value="1"
//                     />
//                     <Stat icon={<EditOutlinedIcon />} value="4" />
//                   </Box>
//                 </Box>

//                 {/* RIGHT ICONS */}
//                 <Box display="flex" alignItems="center" gap={1}>
//                   <IconButton>
//                     <VisibilityIcon color="primary" />
//                   </IconButton>
//                   <IconButton>
//                     <ChatBubbleOutlineIcon color="info" />
//                   </IconButton>
//                   <IconButton>
//                     <FavoriteIcon sx={{ color: "#e53935" }} />
//                   </IconButton>
//                 </Box>
//               </Box>
//             </Card>
//           ))}
//         </Box>

//         {/* ================= RIGHT : LIVE CHAT ================= */}
//         <Box flex={1}>
//           <Card
//             sx={{
//               height: "100%",
//               borderRadius: 3,
//               border: "1px solid #caa56a",
//               display: "flex",
//               flexDirection: "column",
//             }}
//           >
//             {/* CHAT HEADER */}
//             <Box
//               sx={{
//                 background: "#caa56a",
//                 p: 1.5,
//                 borderTopLeftRadius: 12,
//                 borderTopRightRadius: 12,
//               }}
//             >
//               <Typography fontWeight={600}>Live Chat 💬</Typography>
//             </Box>

//             {/* EMPTY CHAT BODY */}
//             <Box flex={1} />

//             <Divider />

//             {/* CHAT INPUT */}
//             <Box display="flex" p={1.5} gap={1}>
//               <TextField
//                 size="small"
//                 placeholder="COMMENT..."
//                 fullWidth
//               />
//               <IconButton
//                 sx={{
//                   background: "#caa56a",
//                   color: "#fff",
//                   "&:hover": { background: "#b8955e" },
//                 }}
//               >
//                 <SendIcon />
//               </IconButton>
//             </Box>
//           </Card>
//         </Box>
//       </Box>
//     </Box>
//   );
// }

// /* ===== STAT COMPONENT ===== */
// function Stat({ icon, value }) {
//   return (
//     <Box display="flex" alignItems="center" gap={0.5}>
//       {icon}
//       <Typography variant="body2">{value}</Typography>
//     </Box>
//   );
// }
