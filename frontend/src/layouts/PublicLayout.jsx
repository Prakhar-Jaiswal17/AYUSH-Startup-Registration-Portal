import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ErrorBoundary from '../components/common/ErrorBoundary';

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F9F6]">
      <Navbar />
      <main className="flex-1">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
