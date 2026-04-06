import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { LogIn } from "lucide-react"
import { NavLink, useNavigate } from "react-router-dom"
import { useContext, useState } from "react"
import api from "../api/api"
import { userContext } from "../context/User_context"
import { toast } from "react-toastify"


export function LoginForm({
    className, ...props
}) {

    const navigate = useNavigate()
    const { setUser, SetMyID, setDeshboardOpen } = useContext(userContext)

    const [data, setData] = useState({
        email: "",
        password: ""
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setData((prev) => ({
            ...prev,
            [name]: value
        }))
    }


    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const response = await api.post('/login', data)
            console.log(response)
            if (response.status == 200) {
                toast.success("Login Successful!");
                setUser(true)
                SetMyID(response.data.user._id)
                setDeshboardOpen(true)
                navigate('/dashboard')
            }
        } catch (error) {
            console.error(error)
            toast.error(error.response?.data?.message || "Invalid credentials. Please try again.");
            setDeshboardOpen(false)
        }
    }




    return (
        <div className={cn("flex flex-col gap-6 w-full px-4 sm:px-0 sm:w-[350px] md:w-[400px] lg:w-[30%] xl:w-[24%] mx-auto", className)} {...props}>
            <Card className="py-6 min-h-[60vh] h-auto">
                <CardHeader>
                    <div className="flex justify-center ">
                        <div className="w-12 py-2.5 bg-zinc-100 rounded-sm flex justify-center ">
                            <LogIn className="" />
                        </div>
                    </div>
                    <CardTitle className="py-2">Login to your account</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={handleSubmit}
                        className="pt-6">
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    name="email"
                                    value={data.email}
                                    onChange={handleChange}
                                />
                            </Field>
                            <Field>
                                <div className="flex items-center">
                                    <FieldLabel htmlFor="password">Password</FieldLabel>
                                    <a
                                        href="#"
                                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                    >
                                        Forgot your password?
                                    </a>
                                </div>
                                <Input id="password" type="password" required
                                    name="password"
                                    value={data.password}
                                    onChange={handleChange}
                                />
                            </Field>
                            <Field className="mt-6 ">
                                <Button type="submit" className="cursor-pointer">Login</Button>
                                <FieldDescription className="text-center">
                                    Don&apos;t have an account? <NavLink to='/'>Sign up</NavLink>
                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div >
    )
}
