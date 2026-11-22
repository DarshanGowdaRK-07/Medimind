
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Report from './pages/Report';
import HealthChat from './pages/HealthChat';
function Protected({children}) { const {user,loading}=useAuth(); if(loading) return <div className="loader-screen">Preparing your workspace…</div>; return user ? children : <Navigate to="/login" replace/>; }
export default function App(){return <Routes><Route path="/login" element={<Login/>}/><Route path="/signup" element={<Signup/>}/><Route path="/" element={<Protected><Layout><Dashboard/></Layout></Protected>}/><Route path="/upload" element={<Protected><Layout><Upload/></Layout></Protected>}/><Route path="/health-chat" element={<Protected><Layout><HealthChat/></Layout></Protected>}/><Route path="/reports/:id" element={<Protected><Layout><Report/></Layout></Protected>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes>}
