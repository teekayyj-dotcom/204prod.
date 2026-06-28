import { Navigate, useLocation } from "react-router-dom";
import { JSX, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../shared/config/firebase";

interface ProtectedRouteProps {
    children: JSX.Element;
    allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const [isFirebaseChecking, setIsFirebaseChecking] = useState(!auth.currentUser);
    const [hasFirebaseUser, setHasFirebaseUser] = useState(!!auth.currentUser);

    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role") || "client";
    const location = useLocation();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setHasFirebaseUser(!!user);
            setIsFirebaseChecking(false);
        });
        return () => unsubscribe();
    }, []);

    if (isFirebaseChecking) {
        return <div className="min-h-screen bg-[#0A0707] flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#D84040] border-t-transparent rounded-full animate-spin"></div></div>;
    }

    if (!token || !hasFirebaseUser) {
        // Redirect to login but save the attempted URL
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (role === "pending") {
        if (location.pathname.startsWith("/pending")) return children;
        return <Navigate to="/pending" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
        // User does not have permission to view this route. Redirect them to their proper home.
        if (role === "client") {
            return <Navigate to="/client" replace />;
        } else if (role === "pending") {
            return <Navigate to="/pending" replace />;
        } else if (role === "admin") {
            return <Navigate to="/admin" replace />;
        } else if (["crew", "editor"].includes(role)) {
            return <Navigate to="/crew" replace />;
        } else {
            // Unknown role or no specific home, kick to login
            return <Navigate to="/login" replace />;
        }
    }

    return children;
}
