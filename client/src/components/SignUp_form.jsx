import React, { useState, useRef, useEffect } from 'react'
import { form_vadidation_schema } from '../utils/Sign_up_form_validation_schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { NavLink, useNavigate } from 'react-router-dom'
import api from '../api/api'
import { ToastContainer, toast } from 'react-toastify';

const SignUp_form = () => {

  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    resolver: zodResolver(form_vadidation_schema),
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      age: "",
      month: "",
      day: "",
      year: "",
      city: "",
      country: "",
      policy: false
    }
  })

  const notify = () => toast("Request is processing...")


  const form_data = async (data) => {
    console.log(data)
    setLoading(true)
    notify()
    try {
      const response = await api.post('/signup', data)
      console.log(response)
      setLoading(false)

      if (response.status === 201) {
        const jwt_token = response.data.jwt_token
        localStorage.setItem("token", jwt_token)
        reset()
        navigate('/verification-page')
      }
    }
    catch (error) {
      setLoading(false)
      console.error(error)
      if (error.response && error.response.status === 409) {
        toast.error("User Already Registered!");
      } else {
        toast.error(error.response?.data?.message || "Something went wrong!");
      }
    }
  }


  return (
    <div className="w-full max-w-2xl px-4 py-8 mx-auto">
      <div className="bg-[#242427] border border-gray-800 shadow-2xl rounded-3xl p-6 sm:p-8 md:p-12 transition-all hover:border-brand/30">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold bg-linear-to-r from-brand-soft via-brand to-brand-strong bg-clip-text text-transparent mb-3 tracking-tighter">
            Create Account
          </h1>
          <p className="text-gray-400 font-medium">Join us and start your journey today.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(form_data)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1">Full Name</label>
              <input
                type="text"
                id="name"
                className="w-full bg-[#1A1A1D] border border-gray-600 text-white text-sm rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand block px-4 py-3.5 placeholder:text-gray-600 transition-all outline-none"
                placeholder="John Doe"
                {...register('name')}
              />
              {<p className="text-red-500 text-xs px-1">{errors.name?.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1">Email Address</label>
              <input
                type="email"
                id="email"
                className="w-full bg-[#1A1A1D] border border-gray-600 text-white text-sm rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand block px-4 py-3.5 placeholder:text-gray-600 transition-all outline-none"
                placeholder="john@example.com"
                {...register('email')}
              />
              {<p className="text-red-500 text-xs px-1">{errors.email?.message}</p>}
            </div>

            {/* Mobile */}
            <div className="space-y-2">
              <label htmlFor="mobile" className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1">Mobile Number</label>
              <input
                type="text"
                id="mobile"
                className="w-full bg-[#1A1A1D] border border-gray-600 text-white text-sm rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand block px-4 py-3.5 placeholder:text-gray-600 transition-all outline-none"
                placeholder="+1 234 567 890"
                {...register('mobile')}
              />
              {<p className="text-red-500 text-xs px-1">{errors.mobile?.message}</p>}
            </div>

            {/* Region */}
            <div className="space-y-2">
              <label htmlFor="region" className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1">Age</label>
              <input
                type="text"
                id="age"
                className="w-full bg-[#1A1A1D] border border-gray-600 text-white text-sm rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand block px-4 py-3.5 placeholder:text-gray-600 transition-all outline-none"
                placeholder="e.g. 18"

                {...register('age')}
              />
              <p className="text-red-500 text-xs px-1">{errors.age?.message}</p>
            </div>
          </div>

          {/* Birthday */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest px-1 text-gray-500">Birthday</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Month */}
              <div className="space-y-2 ">
                <Controller
                  name="month"
                  control={control}
                  render={({ field }) => (
                    <CustomDropdown
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Month"
                      options={["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => ({ label: m, value: i + 1 }))}
                    />
                  )}
                />
                <p className="text-red-500 text-xs px-1">{errors.month?.message}</p>
              </div>

              {/* Day */}
              <div className="space-y-2">
                <Controller
                  name="day"
                  control={control}
                  render={({ field }) => (
                    <CustomDropdown
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Day"
                      options={Array.from({ length: 31 }, (_, i) => ({ label: (i + 1).toString(), value: i + 1 }))}
                    />
                  )}
                />
                <p className="text-red-500 text-xs px-1">{errors.day?.message}</p>
              </div>

              {/* Year */}
              <div className="space-y-2">
                <Controller
                  name="year"
                  control={control}
                  render={({ field }) => (
                    <CustomDropdown
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Year"
                      options={Array.from({ length: 100 }, (_, i) => {
                        const y = new Date().getFullYear() - i;
                        return { label: y.toString(), value: y };
                      })}
                    />
                  )}
                />
                <p className="text-red-500 text-xs px-1">{errors.year?.message}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* City */}
            <div className="space-y-2">
              <label htmlFor="city" className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1">City</label>
              <input
                type="text"
                id="city"
                className="w-full bg-[#1A1A1D] border border-gray-600 text-white text-sm rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand block px-4 py-3.5 placeholder:text-gray-600 transition-all outline-none"
                placeholder="New York"

                {...register('city')}
              />
              <p className="text-red-500 text-xs px-1">{errors.city?.message}</p>
            </div>

            {/* Country */}
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="country" className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1">Country</label>
              <input
                type="text"
                id="country"
                className="w-full bg-[#1A1A1D] border border-gray-600 text-white text-sm rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand block px-4 py-3.5 placeholder:text-gray-600 transition-all outline-none"
                placeholder="United States"
                {...register('country')}
              />
              <p className="text-red-500 text-xs px-1">{errors.country?.message}</p>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="pt-4">
            <label className="flex items-center group cursor-pointer select-none">
              <div className="relative">
                <input name='policy' id="terms" type="checkbox" className="sr-only peer"  {...register('policy')} />
                <div className="w-5 h-5 bg-[#1A1A1D] border-2 border-gray-800 rounded-lg peer-checked:bg-brand peer-checked:border-brand transition-all flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="4">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>
              <span className="ms-3 text-sm font-medium text-gray-500 group-hover:text-gray-300 transition-colors">
                I agree to the <a href="#" className="text-brand font-bold hover:underline transition-all">Terms & Conditions</a>
              </span>
            </label>
            {<p className="text-red-500 text-xs px-2 py-2">{errors.policy?.message}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-4 px-6 text-white font-bold text-sm bg-linear-to-r from-brand-soft via-brand to-brand-strong rounded-2xl shadow-xl shadow-brand/20 hover:shadow-brand/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 transform"
          >
            {loading ? "loading" : "Create Account"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm border-t border-gray-800 pt-8">
          <p className="text-gray-500 font-medium">
            Already have an account?
            <NavLink to='/login' className="text-brand font-bold hover:underline">Log in</NavLink>
          </p>
        </div>
      </div>
    </div>
  )
}

const CustomDropdown = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#1A1A1D] text-white text-sm rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand flex items-center justify-between px-4 py-3.5 transition-all outline-none cursor-pointer"
      >
        <span className={selectedOption ? "text-white" : "text-gray-600"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-[#1A1A1D] rounded-xl shadow-2xl z-50 overflow-hidden border-none max-h-60 overflow-y-auto no-scrollbar">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="px-4 py-3 text-sm text-gray-300 hover:bg-brand/10 hover:text-brand transition-colors cursor-pointer"
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SignUp_form
