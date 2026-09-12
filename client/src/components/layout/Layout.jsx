import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import RouteLoader from "../RouteLoader";
import { useScrollProgress } from "../../hooks/useScrollProgress";

export default function Layout() {
  useScrollProgress();

  return (
    <>
      <div id="progress"></div>
      <Navbar />
      <main>
        <Suspense fallback={<RouteLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
