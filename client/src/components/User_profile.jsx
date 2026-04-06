import React, { useState } from 'react';
import { Camera, User, Lock, Eye, EyeOff } from 'lucide-react';
import api from '../api/api';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const User_profile = () => {
    const [profilePicSrc, setProfilePicSrc] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setloading] = useState(false)
    const fileInputRef = useRef()
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        profileImage: null,
        profileName: "",
        password: ""
    })

    const token = localStorage.getItem("token")

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setProfilePicSrc(imageUrl);

            setFormData((prev) => ({
                ...prev,
                profileImage: file
            }))
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }))
    }



    const handleSubmit = async (e) => {
        e.preventDefault();
        setloading(true)
        try {
            const data = new FormData();

            data.append("profileImage", formData.profileImage)
            data.append("profileName", formData.profileName)
            data.append("password", formData.password)

            const response = await api.post("/user-profile", data,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            if (response) {
                setFormData({
                    profileImage: null,
                    profileName: "",
                    password: ""
                })
            }

            if (response.status == 200) {
                toast.success("Profile created successfully!");
                navigate('/login')
                setloading(false)
                localStorage.removeItem("token")
            }

            // ✅ Clear the Image Preview
            if (profilePicSrc) {
                URL.revokeObjectURL(profilePicSrc); // Clean up memory
                setProfilePicSrc(null);
            }

            // ✅ Clear the actual File Input field
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            // console.log(response)
        } catch (error) {
            console.error("error :- ", error);
            setFormData({
                profileImage: null,
                profileName: "",
                password: ""
            })
            if (error.status == 404) {
                return toast.error("Profile Pic Not Valid")
            }
            toast.error("Failed to create profile. Please try again.");
            setloading(false);

        }

    }
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 relative overflow-hidden font-sans">
            {/* Cinematic background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/30 rounded-full blur-[120px] mix-blend-screen pointer-events-none disabled:select-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/30 rounded-full blur-[120px] mix-blend-screen pointer-events-none disabled:select-none"></div>
            <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-rose-600/20 rounded-full blur-[100px] mix-blend-screen pointer-events-none disabled:select-none"></div>

            {/* Main Card */}
            <div className="relative w-full max-w-md p-8 sm:p-10 rounded-[2rem] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl z-10 m-4 flex flex-col items-center">

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold bg-linear-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-2 tracking-tight">
                        Create Profile
                    </h1>
                    <p className="text-zinc-400 text-sm font-medium">
                        Setup your identity to get started
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="w-full flex flex-col gap-5">
                    {/* Profile Picture Upload */}
                    <div className="flex flex-col items-center justify-center group relative w-28 h-28 mx-auto rounded-full bg-zinc-900 border-2 border-dashed border-zinc-700 hover:border-purple-400/80 transition-all duration-300 cursor-pointer overflow-hidden mb-4 shadow-inner">
                        {profilePicSrc ? (
                            <img src={profilePicSrc} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center text-zinc-500 group-hover:text-purple-400 transition-colors duration-300">
                                <Camera size={28} className="mb-1.5" />
                                <span className="text-[10px] uppercase font-bold tracking-wider">Upload</span>
                            </div>
                        )}

                        {/* Hover Overlay */}
                        {profilePicSrc && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <Camera size={24} className="text-white mb-1.5" />
                                <span className="text-[10px] uppercase text-white font-bold tracking-wider">Change</span>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            ref={fileInputRef}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>

                    {/* User Name Input */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-zinc-400 group-focus-within:text-purple-400 transition-colors duration-300" />
                        </div>
                        <input
                            type="text"
                            placeholder="Username"
                            className="w-full pl-13 pr-4 py-3.5 bg-zinc-900/60 border border-white/5 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40 transition-all duration-300 shadow-inner font-medium"
                            name='profileName'
                            value={formData.profileName}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Password Input */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-zinc-400 group-focus-within:text-pink-400 transition-colors duration-300" />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            className="w-full pl-13 pr-12 py-3.5 bg-zinc-900/60 border border-white/5 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500/40 transition-all duration-300 shadow-inner font-medium"
                            name='password'
                            value={formData.password}
                            onChange={handleChange}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-white focus:outline-none transition-colors"
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>

                    {/* Submit Button */}
                    <button
                        className="w-full mt-4 py-3.5 px-4 bg-linear-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-pink-500 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] transform hover:-translate-y-0.5 transition-all duration-300 group overflow-hidden relative"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            {loading ? "loading" : "Save Profile"}
                        </span>
                        <div className="absolute inset-0 h-full w-full bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default User_profile;