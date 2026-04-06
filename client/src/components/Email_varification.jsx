import React, { useEffect, useRef, useState } from 'react'
import { Navigation2, RefreshCw } from 'lucide-react'
import api from '../api/api'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify';



const Email_varification = () => {
    const token = localStorage.getItem("token")
    const navigate = useNavigate()

    const [otp, setOtp] = useState(new Array(6).fill(""))
    const inputRefs = useRef([])
    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus()
        }
    }, [])

    const handleChange = (value, i) => {
        if (isNaN(value)) return;

        const newOtp = [...otp]
        newOtp[i] = value
        // console.log(newOtp)
        setOtp(newOtp)

        if (value && i < 5) {
            inputRefs.current[i + 1].focus()
        }
    }

    const handleKeyDown = (e, i) => {
        if (e.key === "Backspace" && i > 0 && !otp[i]) {
            inputRefs.current[i - 1].focus()
        }
    }

    const handleSubmit = async () => {
        const code = otp.join("")
        if (code.length === 6) {
            setOtp(new Array(6).fill(""))
            inputRefs.current[0].focus()

            try {
                const response = await api.post("/verify-otp",
                    { code },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (response) {
                    navigate('/user-profile')
                }
            }
            catch (error) {
                console.log(error)

                if (error.response) {
                    const status = error.response.status;

                    if (status === 400) {
                        toast("Invalid OTP ❌");
                    } else if (status === 401) {
                        toast("OTP Expired ⏳");
                    } else if (status === 404) {
                        toast("User not found ❌");
                    } else {
                        toast("Something went wrong ⚠️");
                    }
                } else {
                    toast("Server not responding 🚫");
                }

            }
        }

    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 relative overflow-hidden font-sans">
            {/* Cinematic background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/30 rounded-full blur-[120px] mix-blend-screen pointer-events-none disabled:select-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/30 rounded-full blur-[120px] mix-blend-screen pointer-events-none disabled:select-none"></div>
            
            {/* Main Card */}
            <div className='relative w-full max-w-md p-8 sm:p-10 rounded-[2rem] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl z-10 m-4 flex flex-col items-center'>
                <div className="text-center mb-8">
                    <h1 className='text-3xl font-extrabold bg-linear-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-2 tracking-tight'>Verify Email</h1>
                    <p className='text-zinc-400 text-sm font-medium'>We've sent a code. Enter it below.</p>
                </div>

                <div className='flex justify-center gap-2 sm:gap-3 py-6 w-full'>
                    {
                        otp.map((digit, i) => {
                            return (
                                <input type='text' key={i + 1}
                                    placeholder='0'
                                    maxLength={1}
                                    className='w-10 h-12 sm:w-12 sm:h-14 bg-zinc-900/60 border border-white/10 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-2xl sm:text-3xl placeholder:text-center text-white transition-all shadow-inner'
                                    value={digit}
                                    ref={(el) => inputRefs.current[i] = el}
                                    onChange={(e) => { handleChange(e.target.value, i) }}
                                    onKeyDown={(e) => { handleKeyDown(e, i) }}
                                />
                            )
                        })
                    }
                </div>
                
                <button
                    onClick={handleSubmit}
                    className="w-full mt-6 py-3.5 px-4 bg-linear-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-pink-500 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] transform hover:-translate-y-0.5 transition-all duration-300 group overflow-hidden relative flex justify-center items-center gap-3">
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        Continue <Navigation2 className='rotate-90 w-5 h-5' />
                    </span>
                    <div className="absolute inset-0 h-full w-full bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
                </button>
            </div>
        </div>
    )
}

export default Email_varification