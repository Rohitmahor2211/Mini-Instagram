import React from 'react'
import Sign_Up_page from './pages/Sign_Up_page'
import Varification_page from './pages/Varification_page'
import Routing from './routes/Routing'
import { LoginForm } from './components/LoginForm'
import Login_page from './pages/Login_page'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const App = () => {
  return (
    <>
      <Routing />
      <ToastContainer position="bottom-right" theme="dark" />
    </>
  )
}

export default App