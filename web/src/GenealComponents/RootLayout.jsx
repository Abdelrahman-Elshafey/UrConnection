import { Outlet } from "react-router-dom";
import ScrollToTop from "./ScrollToTop";
import { useAuthListener } from "../features/auth/hooks/useUser";

export default function RootLayout() {
    useAuthListener();

    return (
        <>
            <ScrollToTop />
            <Outlet />
        </>
    );
}
