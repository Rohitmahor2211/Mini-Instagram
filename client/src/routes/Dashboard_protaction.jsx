import React, { useContext } from 'react'
import { userContext } from '../context/User_context'
import { Navigate } from 'react-router-dom'

const Dashboard_protaction = ({ children }) => {
    const { dashboardOpen } = useContext(userContext)

    if (!dashboardOpen) {
        return <Navigate to="/login" replace />
    }
    return (
        <>{children}</>
    )
}

export default Dashboard_protaction