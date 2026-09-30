import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import CompanyDetails from './pages/CompanyDetails';
import MyApplications from './pages/MyApplications';
import Profile from './pages/Profile';
import Students from './pages/Students';
import StudentProfile from './pages/StudentProfile';
import Statistics from './pages/Statistics';

function AppRoutes() {
    const { user } = useAuth();

    return (
        <>
            {user && <Navbar />}
            <Routes>
                <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
                <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

                <Route path="/dashboard" element={
                    <PrivateRoute>
                        <Dashboard />
                    </PrivateRoute>
                } />

                <Route path="/companies" element={
                    <PrivateRoute>
                        <Companies />
                    </PrivateRoute>
                } />

                <Route path="/companies/:id" element={
                    <PrivateRoute>
                        <CompanyDetails />
                    </PrivateRoute>
                } />

                <Route path="/my-applications" element={
                    <PrivateRoute>
                        <MyApplications />
                    </PrivateRoute>
                } />

                <Route path="/profile" element={
                    <PrivateRoute>
                        <Profile />
                    </PrivateRoute>
                } />

                <Route path="/students" element={
                    <PrivateRoute adminOnly={true}>
                        <Students />
                    </PrivateRoute>
                } />

                <Route path="/students/:id" element={
                    <PrivateRoute adminOnly={true}>
                        <StudentProfile />
                    </PrivateRoute>
                } />

                <Route path="/statistics" element={
                    <PrivateRoute adminOnly={true}>
                        <Statistics />
                    </PrivateRoute>
                } />

                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
        </>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
}

export default App;
