import React, { createContext, useEffect, useState } from 'react'
import api from '../api/api'

export const userContext = createContext()

const User_context = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem("userLoggedIn")
        return storedUser ? JSON.parse(storedUser) : false
    })
    const [data, setData] = useState([])
    const [myId, SetMyID] = useState(() => {
        return localStorage.getItem("myId") || ""
    })

    const [dashboardOpen , setDeshboardOpen] = useState(() => {
        const storedUser = localStorage.getItem("userLoggedIn")
        return storedUser ? JSON.parse(storedUser) : false
    })

    const fetchData = async () => {
        if (user) {
            try {
                const response = await api.get('/users')
                if (response.status == 200) {
                    setData(response.data.response)
                }
            } catch (error) {
                console.log(error)
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    setUser(false);
                    SetMyID("");
                }
            }
        }
    }

    useEffect(() => {
        if (user) {
            localStorage.setItem("userLoggedIn", true)
        } else {
            localStorage.removeItem("userLoggedIn")
        }
        
        if (myId) {
            localStorage.setItem("myId", myId)
        } else {
            localStorage.removeItem("myId")
        }
        
        fetchData()
    }, [user, myId])

    return (
        <userContext.Provider value={{ setUser, data, SetMyID, myId, setData,dashboardOpen , setDeshboardOpen }}>
            {children}
        </userContext.Provider>
    )
}

export default User_context