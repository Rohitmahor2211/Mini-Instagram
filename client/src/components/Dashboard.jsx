import React, { useContext, useEffect, useState, useRef } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import { userContext } from "../context/User_context";
import { socket } from "../socket-connection/socket";
import { toast } from "react-toastify";
import {
    Menu, X, Image, Paperclip, Send, Search,
    Check, CheckCheck, LogOut, MessageCircle, Smile, Download,
    MoreVertical, ShieldAlert,
    Trash
} from "lucide-react";

const EMOJI_LIST = [
    "😀", "😂", "🥰", "😍", "😎", "🤩", "😇", "🥺", "😢", "😡",
    "👍", "👎", "👏", "🙌", "🤝", "💪", "🙏", "❤️", "🔥", "⭐",
    "🎉", "🎊", "💯", "✅", "❌", "💬", "👀", "🤔", "😴", "🤗",
    "😋", "🤤", "😜", "🤪", "😏", "🥳", "😱", "💀", "👻", "🫡",
    "✨", "💫", "🌟", "💝", "💘", "💖", "🫶", "🤙", "✌️", "🫰"
];

const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Typing indicator component
const TypingIndicator = () => (
    <div className="flex items-start gap-2 px-1">
        <div className="bg-zinc-800/80 backdrop-blur-sm border border-zinc-700/30 px-4 py-3 rounded-2xl rounded-bl-sm">
            <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-zinc-400 rounded-full typing-dot" style={{ animationDelay: "0s" }}></div>
                <div className="w-2 h-2 bg-zinc-400 rounded-full typing-dot" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 bg-zinc-400 rounded-full typing-dot" style={{ animationDelay: "0.4s" }}></div>
            </div>
        </div>
    </div>
);

// Image Lightbox component
const ImageLightbox = ({ src, onClose }) => {
    const handleDownload = async () => {
        try {
            const response = await fetch(src);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `image_${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            window.open(src, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="relative max-w-3xl max-h-[85vh] w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 p-2 text-zinc-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                    <X size={22} />
                </button>

                {/* Image */}
                <img
                    src={src}
                    alt="Full view"
                    className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
                />

                {/* Download button */}
                <button
                    onClick={handleDownload}
                    className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-purple-600/20 transition-all active:scale-95"
                >
                    <Download size={16} />
                    Download Image
                </button>
            </div>
        </div>
    );
};


export default function Dashboard() {
    const navigate = useNavigate()
    const { data, myId, setUser, SetMyID, setData, setDeshboardOpen } = useContext(userContext)
    const [users, setUsers] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [chatId, setChatId] = useState(null)
    const [message, setMessage] = useState([])
    const [text, setText] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [typing, setTyping] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [lightboxImage, setLightboxImage] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isBlockedByMe, setIsBlockedByMe] = useState(false);
    const [hasBlockedMe, setHasBlockedMe] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const emojiPickerRef = useRef(null);
    const userMenuRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const usersRef = useRef(users);
    const selectedUserRef = useRef(selectedUser);
    const [showBlockConfirm, setShowBlockConfirm] = useState(false);

    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    useEffect(() => {
        usersRef.current = users;
    }, [users]);


    const logout = async () => {
        try {
            const response = await api.get('/logout')
            if (response.status == 200) {
                setUser(false)
                SetMyID("")
                setData([])
                setDeshboardOpen(false)
                navigate('/login')
            }
        } catch (error) {
            toast.error("Logout failed. Please try again.");
            console.error(error)
        }
    }

    const handleUserClick = async (user) => {
        try {
            const response = await api.post("/chat", {
                receiverId: user._id
            })
            setChatId(response.data.chat._id);
            setSelectedUser(user);
            setIsSidebarOpen(false);
            setSearchQuery("");
            setShowUserMenu(false);

            // Fetch full profile to check block status
            const myData = await api.get('/users');
            // In a real app, you might have a specific /profile/:id endpoint
            // For now, we'll assume the user list or a direct check works
            setIsBlockedByMe(user.isBlockedByMe || false); // This depends on backend including this info
            setHasBlockedMe(user.hasBlockedMe || false);

            setUsers(prev => prev.map(u => u._id === user._id ? { ...u, unreadCount: 0 } : u));
            setData(prev => prev.map(u => u._id === user._id ? { ...u, unreadCount: 0 } : u));
        } catch (error) {
            toast.error("Failed to open chat with user.");
            console.error(error.message)
        }
    }

    const fetchMessage = async () => {
        try {
            const response = await api.get(`/messages/${chatId}`)
            setMessage(response.data)

            if (response.data.some(msg => !msg.seen && msg.senderId !== myId)) {
                await api.post('/messages/mark-seen', { chatId });
            }
        } catch (error) {
            toast.error("Failed to load messages.");
            console.error(error)
        }
    }

    useEffect(() => {
        setUsers(data)
        if (chatId) {
            fetchMessage()
        }
    }, [data, chatId])


    // 🔍 Debounced Search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const timer = setTimeout(async () => {
            try {
                const res = await api.get(`/search-users?q=${encodeURIComponent(searchQuery.trim())}`);
                setSearchResults(res.data.results);
            } catch (error) {
                console.error("Search failed:", error);
                setSearchResults([]);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reject video and non-image files
        if (!file.type.startsWith('image/')) {
            toast.info("📸 Only images are supported right now! Videos coming soon ✨", {
                position: "top-center",
                autoClose: 3500,
            });
            e.target.value = '';
            return;
        }

        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    // Close emoji picker on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSendMessage = async () => {
        if (!text.trim() && !selectedImage) return;

        try {
            const formData = new FormData();
            formData.append("chatId", chatId);
            formData.append("receiverId", selectedUser._id);
            if (text.trim()) formData.append("text", text);
            if (selectedImage) formData.append("image", selectedImage);

            const res = await api.post("/message", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            setMessage(prev => [...prev, res.data]);
            setText("");
            setSelectedImage(null);
            setImagePreview(null);
        } catch (error) {
            console.error("Failed to send message:", error);
            if (error.response?.status === 403) {
                toast.error("Message not sent. You have blocked this user or been blocked.");
            } else {
                toast.error("Failed to send message. Please try again.");
            }
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [message]);

    const handleTyping = () => {
        socket.emit("typing", {
            receiverId: selectedUser._id
        });
    };

    useEffect(() => {
        socket.on("typing", () => {
            setTyping(true);
            setTimeout(() => setTyping(false), 2000);
        });

        return () => socket.off("typing");
    }, []);



    useEffect(() => {
        if (myId) {
            socket.emit("join", myId);
        }
    }, [myId]);


    useEffect(() => {
        const handleReceiveMessage = (newMsg) => {
            if (chatId === newMsg.chatId) {
                setMessage((prev) => [...prev, newMsg]);

                if (newMsg.senderId !== myId) {
                    api.post('/messages/mark-seen', { chatId });
                }
            }
        };

        const handleNotification = ({ senderId, chatId: incomingChatId }) => {
            if (chatId !== incomingChatId) {
                const sender = usersRef.current.find(u => u._id === senderId);
                if (sender) {
                    toast(`New message from ${sender.profileName}`, {
                        icon: "💬",
                        position: "top-right",
                        autoClose: 3000,
                    });
                }

                setUsers(prev =>
                    prev.map(u =>
                        u._id === senderId
                            ? { ...u, unreadCount: (u.unreadCount || 0) + 1 }
                            : u
                    )
                );
            }
        };

        const handleMessagesSeen = ({ chatId: seenChatId }) => {
            if (chatId === seenChatId) {
                setMessage(prev =>
                    prev.map(msg => ({ ...msg, seen: true }))
                );
            }
        };

        const handleReactionUpdate = ({ messageId, reactions }) => {
            setMessage(prev =>
                prev.map(msg => msg._id === messageId ? { ...msg, reactions } : msg)
            );
        };

        const handleUserBlocked = ({ blockerId }) => {
            setUsers(prev => prev.map(u => u._id === blockerId ? { ...u, hasBlockedMe: true } : u));
            setData(prev => prev.map(u => u._id === blockerId ? { ...u, hasBlockedMe: true } : u));
            if (selectedUserRef.current?._id === blockerId) {
                setHasBlockedMe(true);
            }
        };

        const handleUserUnblocked = ({ blockerId }) => {
            setUsers(prev => prev.map(u => u._id === blockerId ? { ...u, hasBlockedMe: false } : u));
            setData(prev => prev.map(u => u._id === blockerId ? { ...u, hasBlockedMe: false } : u));
            if (selectedUserRef.current?._id === blockerId) {
                setHasBlockedMe(false);
            }
        };

        const handleMessageDeleted = ({ messageId }) => {
            setMessage(prev => prev.filter(msg => msg._id !== messageId));
        };

        socket.on("receiveMessage", handleReceiveMessage);
        socket.on("newMessageNotification", handleNotification);
        socket.on("messagesSeen", handleMessagesSeen);
        socket.on("messageReaction", handleReactionUpdate);
        socket.on("userBlocked", handleUserBlocked);
        socket.on("userUnblocked", handleUserUnblocked);
        socket.on("messageDeleted", handleMessageDeleted);

        return () => {
            socket.off("receiveMessage", handleReceiveMessage);
            socket.off("newMessageNotification", handleNotification);
            socket.off("messagesSeen", handleMessagesSeen);
            socket.off("messageReaction", handleReactionUpdate);
            socket.off("userBlocked", handleUserBlocked);
            socket.off("userUnblocked", handleUserUnblocked);
            socket.off("messageDeleted", handleMessageDeleted);
        };

    }, [chatId, myId]);


    const handleReact = async (messageId, emoji) => {
        try {
            const res = await api.post('/messages/react', { messageId, emoji });
            setMessage(prev =>
                prev.map(msg => msg._id === messageId ? { ...msg, reactions: res.data.reactions } : msg)
            );
        } catch (error) {
            console.error("Reaction failed:", error);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            await api.delete(`/message/${messageId}`);
            setMessage(prev => prev.filter(msg => msg._id !== messageId));
            toast.success("Message deleted");
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Failed to delete message");
        }
    };

    const handleBlockUser = async () => {
        try {
            await api.post('/block-user', { targetUserId: selectedUser._id });
            toast.info(`Blocked ${selectedUser.profileName}`);
            
            // Instantly update state
            setIsBlockedByMe(true);
            setUsers(prev => prev.map(u => u._id === selectedUser._id ? { ...u, isBlockedByMe: true } : u));
            setData(prev => prev.map(u => u._id === selectedUser._id ? { ...u, isBlockedByMe: true } : u));
            setShowBlockConfirm(false);
            setShowUserMenu(false);
        } catch (error) {
            toast.error("Failed to block user");
        }
    };

    const handleUnblockUser = async () => {
        try {
            await api.post('/unblock-user', { targetUserId: selectedUser._id });
            toast.success(`Unblocked ${selectedUser.profileName}`);
            
            // Instantly update state
            setIsBlockedByMe(false);
            setUsers(prev => prev.map(u => u._id === selectedUser._id ? { ...u, isBlockedByMe: false } : u));
            setData(prev => prev.map(u => u._id === selectedUser._id ? { ...u, isBlockedByMe: false } : u));
            setShowUserMenu(false);
        } catch (error) {
            toast.error("Failed to unblock user");
        }
    };


    const displayUsers = isSearching ? searchResults : users;


    return (
        <div className="h-screen w-full flex bg-[#0a0a0f] text-white relative overflow-hidden font-sans select-none">
            {/* ATMOSPHERIC BACKGROUND */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-50 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[130px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-600/10 blur-[130px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-blue-600/5 blur-[110px] animate-pulse" style={{ animationDelay: '4s' }}></div>
            </div>

            {/* MOBILE OVERLAY */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-md z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* ═══════════════════ LEFT SIDEBAR ═══════════════════ */}
            <div className={`
                absolute z-40 h-full w-[85%] max-w-[340px] flex flex-col
                bg-[#0f0f17]/95 backdrop-blur-2xl
                border-r border-white/6
                transition-transform duration-300 ease-out transform
                md:relative md:w-[320px] md:min-w-[280px] md:translate-x-0
                ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            `}>
                {/* Sidebar Header */}
                <div className="px-5 pt-6 pb-4">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <MessageCircle size={20} className="text-white" />
                            </div>
                            <h1 className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white to-white/60">Messages</h1>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="md:hidden p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative group">
                        <Search
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-purple-400 transition-colors duration-200"
                            size={16}
                        />
                        <input
                            type="text"
                            placeholder="Search people..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-white/4 border border-white/6 focus:border-purple-500/40 focus:bg-white/6 outline-none transition-all duration-200 placeholder:text-zinc-600"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-zinc-500 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Search Results Count */}
                {isSearching && (
                    <div className="px-5 py-1.5">
                        <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-widest">
                            {searchResults.length > 0 ? `${searchResults.length} result${searchResults.length > 1 ? 's' : ''}` : 'No results'}
                        </span>
                    </div>
                )}

                {/* User / Chat List */}
                <div className="flex-1 overflow-y-auto no-scrollbar px-2 py-1">
                    {displayUsers.map((user) => (
                        <div
                            key={user._id}
                            className={`
                                group flex items-center gap-3 p-3 mx-1 mb-0.5 cursor-pointer rounded-xl
                                transition-all duration-200 active:scale-[0.98]
                                ${selectedUser?._id === user._id
                                    ? 'bg-purple-500/10 border border-purple-500/20'
                                    : 'hover:bg-white/4 border border-transparent'}
                            `}
                            onClick={() => handleUserClick(user)}
                        >
                            {/* Avatar */}
                            <div className={`relative shrink-0 ${(user.isBlockedByMe || user.hasBlockedMe) ? 'grayscale opacity-60' : ''}`}>
                                {user.profilePic ? (
                                    <img
                                        src={user.profilePic}
                                        alt={user.profileName}
                                        className="w-11 h-11 rounded-full object-cover ring-2 ring-white/6"
                                    />
                                ) : (
                                    <div className="w-11 h-11 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-sm shadow-lg shadow-purple-500/20">
                                        {user.profileName?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                {/* Online dot (only if not blocked) */}
                                {(!user.isBlockedByMe && !user.hasBlockedMe) && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-[2.5px] border-[#0f0f17] rounded-full online-pulse"></div>
                                )}
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <p className={`font-semibold text-[13px] truncate ${selectedUser?._id === user._id ? 'text-purple-300' : (user.isBlockedByMe || user.hasBlockedMe) ? 'text-zinc-500' : 'text-zinc-200'}`}>
                                            {user.profileName}
                                        </p>
                                        {(user.isBlockedByMe || user.hasBlockedMe) && (
                                            <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-zinc-800/80 text-[9px] font-bold text-zinc-500 uppercase tracking-tighter border border-white/5">
                                                {user.isBlockedByMe ? "Blocked" : "Restricted"}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-zinc-600 shrink-0 capitalize">now</span>
                                </div>
                                <p className={`text-[11px] truncate ${user.isBlockedByMe || user.hasBlockedMe ? 'text-zinc-600 italic' : 'text-zinc-500'}`}>
                                    {user.isBlockedByMe ? 'You blocked this user' : user.hasBlockedMe ? 'Unavailable' : selectedUser?._id === user._id ? 'Active chat' : 'Tap to message'}
                                </p>
                            </div>

                            {/* Unread Badge */}
                            {user.unreadCount > 0 && (
                                <div className="min-w-5 h-5 px-1.5 bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-lg shadow-purple-600/30 shrink-0">
                                    {user.unreadCount > 99 ? '99+' : user.unreadCount}
                                </div>
                            )}
                        </div>
                    ))}

                    {displayUsers.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
                            <Search size={32} className="mb-3 opacity-40" />
                            <p className="text-sm font-medium">
                                {isSearching ? "No profiles match your search" : "No conversations yet"}
                            </p>
                        </div>
                    )}
                </div>

                {/* Logout */}
                <div className="p-3 border-t border-white/4">
                    <button
                        onClick={logout}
                        className="group w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-red-400/80 hover:text-red-400 bg-red-500/4 hover:bg-red-500/8 border border-red-500/10 hover:border-red-500/20 transition-all duration-200 active:scale-[0.98]"
                    >
                        <LogOut size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                        Log out
                    </button>
                </div>
            </div>

            {/* ═══════════════════ MAIN CHAT AREA ═══════════════════ */}
            <div className="flex-1 flex flex-col h-full min-w-0 bg-[#0a0a0f] relative z-10 animate-in fade-in duration-500">

                {/* Chat Header */}
                <div className="shrink-0 px-4 md:px-6 py-3.5 border-b border-white/6 bg-[#0a0a0f]/80 backdrop-blur-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu size={22} />
                        </button>

                        {selectedUser ? (
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    {selectedUser.profilePic ? (
                                        <img src={selectedUser.profilePic} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-white/6" />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-xs">
                                            {selectedUser.profileName?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    {(!isBlockedByMe && !hasBlockedMe) && (
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0a0a0f] rounded-full"></div>
                                    )}
                                </div>
                                <div>
                                    <h2 className="font-semibold text-sm leading-tight flex items-center gap-2">
                                        {selectedUser.profileName}
                                        {(isBlockedByMe || hasBlockedMe) && (
                                            <span className="px-1.5 py-0.5 rounded-md bg-zinc-800/80 text-[8px] font-bold text-zinc-500 uppercase tracking-tighter border border-white/5 z-50">
                                                {isBlockedByMe ? "Blocked" : "Restricted"}
                                            </span>
                                        )}
                                    </h2>
                                    {(isBlockedByMe || hasBlockedMe) ? (
                                        <p className="text-[10px] text-zinc-600 font-semibold mt-0.5 italic">
                                            {isBlockedByMe ? "You have blocked this account" : "Status unavailable"}
                                        </p>
                                    ) : typing ? (
                                        <p className="text-[10px] text-purple-400 font-semibold animate-pulse mt-0.5">typing...</p>
                                    ) : (
                                        <p className="text-[10px] text-emerald-400/80 font-semibold mt-0.5">online</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <MessageCircle size={20} className="text-zinc-600" />
                                <h2 className="font-medium text-sm text-zinc-500">Select a conversation</h2>
                            </div>
                        )}
                    </div>

                    {selectedUser && (
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                            >
                                <MoreVertical size={20} />
                            </button>

                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-[#16161e]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-30 py-2 animate-in fade-in zoom-in duration-200">
                                    {isBlockedByMe ? (
                                        <button
                                            onClick={handleUnblockUser}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-400 hover:bg-white/5 transition-colors"
                                        >
                                            <ShieldAlert size={16} />
                                            Unblock User
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setShowBlockConfirm(true)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors"
                                        >
                                            <ShieldAlert size={16} />
                                            Block User
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Block Confirmation Modal */}
                {showBlockConfirm && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowBlockConfirm(false)}></div>
                        <div className="relative bg-[#16161e] border border-white/10 p-6 rounded-3xl max-w-sm w-full shadow-2xl animate-in zoom-in duration-200">
                            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-5 mx-auto">
                                <ShieldAlert size={32} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-center mb-2">Block {selectedUser?.profileName}?</h3>
                            <p className="text-zinc-500 text-sm text-center mb-8">They won't be able to message you or see your online status anymore. You can unblock them at any time.</p>
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={handleBlockUser}
                                    className="w-full py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors"
                                >
                                    Block Account
                                </button>
                                <button 
                                    onClick={() => setShowBlockConfirm(false)}
                                    className="w-full py-3 bg-white/5 text-zinc-300 font-bold rounded-xl hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto chat-scrollbar px-4 md:px-6 py-4 space-y-1">

                    {/* Empty State */}
                    {!selectedUser && (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-white/3 border border-white/6 flex items-center justify-center">
                                    <MessageCircle size={32} className="text-zinc-700" />
                                </div>
                                <p className="text-lg font-semibold text-zinc-400 mb-1">Welcome to Messages</p>
                                <p className="text-sm text-zinc-600 max-w-xs">Select a conversation from the sidebar or search for someone to start chatting.</p>
                            </div>
                        </div>
                    )}

                    {/* Message Bubbles */}
                    {message.map((msg, index) => {
                        const isMe = msg.senderId.toString() === myId;
                        const prevMsg = index > 0 ? message[index - 1] : null;
                        const showAvatar = !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId);

                        return (
                            <div
                                key={msg._id}
                                className={`flex items-end gap-2 msg-animate ${isMe ? "justify-end" : "justify-start"}`}
                                style={{ animationDelay: `${Math.min(index * 0.03, 0.5)}s` }}
                            >
                                {/* Receiver avatar */}
                                {!isMe && (
                                    <div className="w-7 shrink-0 mb-1">
                                        {showAvatar && (
                                            selectedUser?.profilePic ? (
                                                <img src={selectedUser.profilePic} className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10" alt="" />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                                    {selectedUser?.profileName?.charAt(0).toUpperCase()}
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}

                                {/* Bubble */}
                                <div className={`relative max-w-[75%] md:max-w-sm ${isMe ? "order-1" : ""} group/msg`}>
                                    <div className={`
                                        px-3.5 py-2.5 rounded-2xl transition-all backdrop-blur-md
                                        ${isMe
                                            ? "bg-purple-500/10 text-zinc-100 rounded-br-md border border-purple-500/20 shadow-lg shadow-purple-500/5"
                                            : "bg-white/5 text-zinc-100 rounded-bl-md border border-white/10 shadow-sm"
                                        }
                                    `}>
                                        {/* Image */}
                                        {msg.image && (
                                            <div
                                                className="mb-2 -mx-1 -mt-1 overflow-hidden rounded-xl cursor-pointer"
                                                onClick={() => setLightboxImage(msg.image)}
                                            >
                                                <img
                                                    src={msg.image}
                                                    alt="Shared"
                                                    className="max-w-full rounded-xl hover:scale-[1.02] transition-transform duration-300 border-none outline-none"
                                                />
                                            </div>
                                        )}

                                        {/* Text */}
                                        {msg.text && (
                                            <p className="text-[13px] leading-relaxed wrap-break-word whitespace-pre-wrap">{msg.text}</p>
                                        )}

                                        {/* Time & Status */}
                                        <div className={`flex items-center gap-1.5 mt-1.5 ${isMe ? "justify-end" : "justify-start"}`}>
                                            <span className={`text-[10px] font-medium ${isMe ? "text-purple-300/60" : "text-zinc-500"}`}>
                                                {formatTime(msg.createdAt)}
                                            </span>
                                            {isMe && (
                                                msg.seen
                                                    ? <CheckCheck size={13} className="text-purple-400" />
                                                    : <Check size={13} className="text-purple-400/50" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Reactions Display */}
                                    {msg.reactions?.length > 0 && (
                                        <div className={`absolute -bottom-2 ${isMe ? "right-2" : "left-2"} flex gap-1 bg-[#1a1a23]/95 backdrop-blur-sm border border-white/10 rounded-full px-2 py-0.5 shadow-xl z-10 animate-in fade-in zoom-in duration-200`}>
                                            <div className="flex -space-x-1.5">
                                                {msg.reactions.map((r, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-[14px] leading-none p-0.5 hover:scale-125 transition-transform"
                                                        title={r.userId === myId ? "You reacted" : ""}
                                                    >
                                                        {r.emoji}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Reaction Trigger (Hover) */}
                                    <div className={`
                                        absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-opacity flex gap-1
                                        ${isMe ? "-left-20 pr-2" : "-right-20 pl-2"}
                                    `}>
                                        {["❤️", "😂", "😮", "😢", "👍"].map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={() => handleReact(msg._id, emoji)}
                                                className="w-6 h-6 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-xs transition-all active:scale-90"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                        {isMe && (
                                            <button
                                                onClick={() => handleDeleteMessage(msg._id)}
                                                className="w-6 h-6 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 rounded-full transition-all active:scale-90"
                                                title="Delete message"
                                            >
                                                <Trash size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Typing Indicator */}
                    {typing && selectedUser && <TypingIndicator />}

                    <div ref={messagesEndRef} />
                </div>

                {/* ═══════ Input Area ═══════ */}
                <div className="shrink-0 px-4 md:px-6 py-3 border-t border-white/6 bg-[#0a0a0f]/90 backdrop-blur-xl">

                    {(isBlockedByMe || hasBlockedMe) ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-6 px-4 bg-white/2 border border-white/5 rounded-3xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center mb-1">
                                <ShieldAlert size={18} className="text-zinc-500" />
                            </div>
                            <div className="text-center">
                                <p className="text-zinc-300 text-[13px] font-semibold mb-1">
                                    {isBlockedByMe ? "You have blocked this account" : "This account is restricted"}
                                </p>
                                <p className="text-zinc-600 text-[11px] max-w-[240px] leading-relaxed mx-auto">
                                    {isBlockedByMe 
                                        ? "You won't see their messages or status. Unblock to resume the conversation."
                                        : "You can no longer message this account or see their active status."}
                                </p>
                            </div>
                            {isBlockedByMe && (
                                <button
                                    onClick={handleUnblockUser}
                                    className="mt-2 px-6 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 text-xs font-bold rounded-full border border-purple-500/20 transition-all active:scale-95"
                                >
                                    Unblock {selectedUser?.profileName}
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Image Preview */}
                            {imagePreview && (
                                <div className="mb-3 inline-flex">
                                    <div className="relative group">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-20 h-20 object-cover rounded-xl ring-1 ring-white/10 shadow-xl"
                                        />
                                        <button
                                            onClick={() => {
                                                setSelectedImage(null);
                                                setImagePreview(null);
                                            }}
                                            className="absolute -top-2 -right-2 p-1 bg-zinc-800 text-white rounded-full border border-zinc-700 hover:bg-zinc-700 shadow-lg transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Input Row */}
                            <div className="flex items-end gap-2">
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                />

                                {/* Attachment */}
                                <button
                                    onClick={() => fileInputRef.current.click()}
                                    className="shrink-0 p-2.5 text-zinc-500 hover:text-purple-400 hover:bg-white/5 rounded-xl transition-all active:scale-90"
                                    disabled={!selectedUser}
                                >
                                    <Paperclip size={20} />
                                </button>

                                {/* Text Input */}
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        placeholder={selectedUser ? "Write a message..." : "Select a chat to start..."}
                                        className="w-full px-4 py-2.5 text-sm rounded-xl bg-white/4 border border-white/6 focus:border-purple-500/40 focus:bg-white/6 outline-none transition-all duration-200 disabled:opacity-40 placeholder:text-zinc-600 pr-10"
                                        value={text}
                                        onChange={(e) => {
                                            setText(e.target.value);
                                            handleTyping();
                                        }}
                                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                        disabled={!selectedUser}
                                    />
                                    <button
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                                        disabled={!selectedUser}
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    >
                                        <Smile size={18} />
                                    </button>

                                    {/* Emoji Picker */}
                                    {showEmojiPicker && (
                                        <div
                                            ref={emojiPickerRef}
                                            className="absolute bottom-full right-0 mb-3 w-72 bg-[#16161e]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-3 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200"
                                        >
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                                                <Smile size={12} className="text-purple-400" />
                                                Emoji Picker
                                            </p>
                                            <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto pr-1 chat-scrollbar">
                                                {EMOJI_LIST.map((emoji, i) => (
                                                    <button
                                                        key={i}
                                                        className="w-8 h-8 flex items-center justify-center text-lg rounded-lg hover:bg-white/10 transition-all active:scale-90"
                                                        onClick={() => {
                                                            setText(prev => prev + emoji);
                                                            // Optional: don't close so they can add multiple
                                                        }}
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Send Button */}
                                <button
                                    className={`
                                        shrink-0 p-2.5 rounded-xl transition-all duration-200 active:scale-90
                                        ${(!text.trim() && !selectedImage) || !selectedUser
                                            ? "bg-white/4 text-zinc-600"
                                            : "bg-purple-600 text-white shadow-lg shadow-purple-600/20 hover:bg-purple-500"
                                        }
                                    `}
                                    onClick={handleSendMessage}
                                    disabled={!selectedUser || (!text.trim() && !selectedImage)}
                                >
                                    <Send size={18} className={(text.trim() || selectedImage) ? "translate-x-0.5 -translate-y-0.5" : ""} />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
            {/* Image Lightbox */}
            {lightboxImage && (
                <ImageLightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />
            )}
        </div>
    );
}   
