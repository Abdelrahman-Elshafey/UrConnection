import { Outlet } from "react-router-dom";
import ScrollToTop from "./ScrollToTop";

export default function RootLayout() {
    return (
        <>
            <ScrollToTop />
            <Outlet />
        </>
    );
}
