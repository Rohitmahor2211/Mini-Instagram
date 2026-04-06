import React, { useContext, useEffect, useState, useRef } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import { userContext } from "../context/User_context";
import { socket } from "../socket-connection/socket";
import { toast } from "react-toastify";
import { Menu, X, Image, Paperclip, Send, Search } from "lucide-react";

const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    const [isSearching, setIsSearching] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const usersRef = useRef(users);

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
            setSelectedUser(user)
            setIsSidebarOpen(false); // overlay auto close on mobile

            // Clear unread count locally when opened
            setUsers(prev => prev.map(u => u._id === user._id ? { ...u, unreadCount: 0 } : u));
            // Also update the global data source so it doesn't revert on refetch
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

            // Mark fetched unread messages as seen if I am not the sender
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
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSendMessage = async () => {
        if (!text.trim() && !selectedImage) return;

        try {
            const formData = new FormData();
            formData.append("chatId", chatId);
            formData.append("receiverId", selectedUser._id);
            if (text.trim()) formData.append("text", text);
            if (selectedImage) formData.append("image", selectedImage);

            const res = await api.post("/message", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setMessage((prev) => [...prev, res.data]);
            setText("");
            setSelectedImage(null);
            setImagePreview(null);

        } catch (error) {
            toast.error("Failed to send message.");
            console.error(error);
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
        // 🔥 FULL MESSAGE (chat open)
        const handleReceiveMessage = (newMsg) => {
            if (chatId === newMsg.chatId) {
                setMessage((prev) => [...prev, newMsg]);

                // mark seen
                if (newMsg.senderId !== myId) {
                    api.post('/messages/mark-seen', { chatId });
                }
            }
        };

        // 🔥 NOTIFICATION (chat closed)
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

        // 🔥 SEEN UPDATE
        const handleMessagesSeen = ({ chatId: seenChatId }) => {
            if (chatId === seenChatId) {
                setMessage(prev =>
                    prev.map(msg => ({ ...msg, seen: true }))
                );
            }
        };

        socket.on("receiveMessage", handleReceiveMessage);
        socket.on("newMessageNotification", handleNotification);
        socket.on("messagesSeen", handleMessagesSeen);

        return () => {
            socket.off("receiveMessage", handleReceiveMessage);
            socket.off("newMessageNotification", handleNotification);
            socket.off("messagesSeen", handleMessagesSeen);
        };

    }, [chatId, myId]);




    return (
        <div className="h-screen w-full flex bg-zinc-950 text-white relative">

            {/* MOBILE OVERLAY */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-10 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* LEFT SIDEBAR */}
            <div className={`absolute z-20 h-full w-3/4 max-w-[320px] bg-zinc-950 border-r border-zinc-800 flex flex-col transition-transform duration-300 transform md:relative md:w-[30%] md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>

                {/* Mobile close button inside sidebar */}
                <div className="md:hidden p-4 border-b border-zinc-800 flex justify-between items-center">
                    <h2 className="font-bold text-xl bg-linear-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Chats</h2>
                    <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-zinc-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search profiles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-zinc-900 border border-zinc-800 focus:border-purple-500/50 outline-none transition-colors"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {/* Search Results Header */}
                    {isSearching && (
                        <div className="px-4 py-2 text-xs text-zinc-500 font-medium uppercase tracking-wider border-b border-zinc-800/50">
                            {searchResults.length > 0 ? `${searchResults.length} result${searchResults.length > 1 ? 's' : ''} found` : 'No results found'}
                        </div>
                    )}

                    {(isSearching ? searchResults : users).map((user) => (
                        <div
                            key={user._id}
                            className={`flex items-center gap-3 p-4 cursor-pointer border-b border-zinc-800/50 transition-colors ${selectedUser?._id === user._id ? 'bg-zinc-800/80' : 'hover:bg-zinc-900'}`}
                            onClick={(e) => { handleUserClick(user) }}
                        >
                            {user.profilePic ? (
                                <img src={user.profilePic} alt={user.profileName} className="w-12 h-12 rounded-full object-cover border border-zinc-700" />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-lg shadow-sm" >
                                    {user.profileName?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-zinc-100 truncate">{user.profileName}</p>
                                <p className="text-xs text-zinc-400 truncate">Tap to open chat</p>
                            </div>
                            {user.unreadCount > 0 && (
                                <div className="bg-purple-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md shrink-0">
                                    {user.unreadCount > 99 ? '99+' : user.unreadCount}
                                </div>
                            )}
                        </div>
                    ))}
                    {(isSearching ? searchResults : users).length === 0 && (
                        <div className="p-4 text-center text-zinc-500 text-sm mt-4">
                            {isSearching ? "No profiles match your search." : "No users found."}
                        </div>
                    )}
                </div>

                {/* Logout */}
                <div onClick={logout} className="p-4 border-t border-zinc-800">
                    <button className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-500 font-medium py-3 rounded-xl transition-colors border border-red-600/20">
                        Logout
                    </button>
                </div>
            </div>

            {/* RIGHT CHAT WINDOW */}
            <div className="flex-1 flex flex-col h-full overflow-hidden w-full absolute md:relative z-0">
                {/* Header */}
                <div className="p-4 border-b border-zinc-800 flex items-center gap-3 bg-zinc-950/80 backdrop-blur-md">
                    <button
                        className="md:hidden text-zinc-400 hover:text-white"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
                    {selectedUser ? (
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                {selectedUser.profilePic ? (
                                    <img src={selectedUser.profilePic} alt="" className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-sm" >
                                        {selectedUser.profileName?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-zinc-950 rounded-full"></div>
                            </div>
                            <div>
                                <h2 className="font-semibold text-lg leading-tight">{selectedUser.profileName}</h2>
                                {typing ? (
                                    <p className="text-[10px] text-purple-400 font-bold animate-pulse">Typing...</p>
                                ) : (
                                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Active Now</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <h2 className="font-semibold text-zinc-400">Select a user to chat</h2>
                    )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 pb-6">
                    {!selectedUser && (
                        <div className="h-full flex items-center justify-center text-zinc-500">
                            <div className="text-center">
                                <p className="text-xl font-medium mb-1">Welcome to Messages</p>
                                <p className="text-sm">Choose someone from the sidebar to chat.</p>
                            </div>
                        </div>
                    )}
                    {message.map((msg) => {
                        const isMe = msg.senderId.toString() === myId;

                        return (
                            <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                <div className={`flex flex-col gap-1 max-w-[80%] md:max-w-md ${isMe ? "items-end" : "items-start"}`}>
                                    <div className={`px-4 py-2.5 rounded-2xl wrap-break-word shadow-md ${isMe ? "bg-purple-600 text-white rounded-tr-sm shadow-md" : "bg-zinc-800 text-zinc-100 rounded-tl-sm shadow-sm border border-zinc-700/50"}`}>
                                        {msg.image && (
                                            <img
                                                src={msg.image}
                                                alt="Shared content"
                                                className="max-w-full rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => window.open(msg.image, "_blank")}
                                            />
                                        )}
                                        {msg.text && <p className="text-sm">{msg.text}</p>}
                                        
                                        <div className={`flex items-center gap-1.5 mt-1 ${isMe ? "justify-end" : "justify-start"} opacity-60`}>
                                            <span className="text-[10px] font-medium tracking-tight">
                                                {formatTime(msg.createdAt)}
                                            </span>
                                            {isMe && (
                                                <span className="text-sm leading-none">
                                                    {msg.seen ? "✔✔" : "✔"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex flex-col gap-2">
                    {/* Image Preview Overlay */}
                    {imagePreview && (
                        <div className="relative w-20 h-20 mb-2 border border-zinc-700 rounded-lg overflow-hidden group">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                onClick={() => {
                                    setSelectedImage(null);
                                    setImagePreview(null);
                                }}
                                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                        />
                        <button
                            onClick={() => fileInputRef.current.click()}
                            className="text-zinc-400 hover:text-purple-500 transition-colors p-2"
                            disabled={!selectedUser}
                        >
                            <Paperclip size={22} />
                        </button>

                        <input
                            type="text"
                            placeholder={selectedUser ? "Type a message..." : "Select a user first"}
                            className="flex-1 px-4 py-3 text-sm rounded-xl bg-zinc-900 border border-zinc-800 focus:border-purple-500/50 outline-none transition-colors disabled:opacity-50"
                            value={text}
                            onChange={(e) => {
                                setText(e.target.value);
                                handleTyping();
                            }}
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                            disabled={!selectedUser}
                        />

                        <button
                            className="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-6 py-3 font-medium rounded-xl shadow-lg transition-all disabled:opacity-50 active:scale-95"
                            onClick={handleSendMessage}
                            disabled={!selectedUser || (!text.trim() && !selectedImage)}
                        >Send</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
